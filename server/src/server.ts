import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { PrismaClient, Role, OrderStatus } from '@prisma/client';
import { z } from 'zod';
import axios from 'axios';
import dotenv from 'dotenv';

// Services
import { uploadFileToS3 } from './services/s3';
import { sendEmail } from './services/ses';
import { sendWhatsAppMessage } from './services/whatsapp';
import { createPixPayment } from './services/mercadopago';

dotenv.config();

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Cliente Google Auth
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Tipos customizados
interface AuthRequest extends Request {
  user?: {
    id: string;
    role: Role;
  };
}

// Middleware
app.use(helmet());
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

const upload = multer({ 
  storage: multer.memoryStorage(), 
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 
                          'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Middleware de autenticação
const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: true, message: 'Token ausente' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: true, message: 'Token inválido' });
  }
};

// Schemas de validação Zod
const RegisterSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  birthDate: z.string().optional()
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Validação dinâmica para detalhes do pedido
const QualifiedSearchDetailsSchema = z.object({
  cpfCnpj: z.string(),
  state: z.string(),
  city: z.string(),
  registries: z.string().optional()
});

const DigitalCertificateImoveisSchema = z.object({
  certificateType: z.literal('imovel'),
  state: z.string(),
  city: z.string(),
  registry: z.string(),
  matricula: z.string()
});

const DigitalCertificateNascimentoSchema = z.object({
  certificateType: z.literal('nascimento'),
  fullName: z.string().min(3),
  birthDate: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/),
  state: z.string(),
  city: z.string(),
  registry: z.string(),
  filiacao1: z.string(),
  filiacao2: z.string().optional()
});

// Health Check
app.get('/', (req: Request, res: Response) => {
  res.send('✅ Edari API está online e funcionando!');
});

// ===================== AUTH ROUTES =====================

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) return res.status(400).json({ error: true, message: 'E-mail já cadastrado.' });
    
    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await prisma.user.create({ 
      data: {
        ...data,
        passwordHash,
        role: 'CLIENT'
      }
    });
    
    // Send Confirmation Email
    await sendEmail(
      data.email, 
      "Confirme seu cadastro na Edari", 
      `<h2>Bem-vindo(a) ${data.name}!</h2>
       <p>Clique no link abaixo para confirmar seu cadastro:</p>
       <a href="${process.env.FRONTEND_URL}/confirm?token=${jwt.sign({email: data.email}, JWT_SECRET)}">
         Confirmar E-mail
       </a>`
    );
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ 
      data: { token, user: { ...user, passwordHash: undefined } } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Dados inválidos', details: error.errors });
    }
    console.error(error);
    res.status(500).json({ error: true, message: 'Erro interno.' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const data = LoginSchema.parse(req.body);
    const user = await prisma.user.findUnique({ where: { email: data.email } });
    
    if (!user || !user.passwordHash || !(await bcrypt.compare(data.password, user.passwordHash))) {
      return res.status(401).json({ error: true, message: 'Credenciais inválidas.' });
    }
    
    if (!user.isVerified) {
      return res.status(401).json({ error: true, code: 'EMAIL_NOT_VERIFIED', message: 'E-mail não verificado.' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      data: { token, user: { ...user, passwordHash: undefined } } 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Dados inválidos' });
    }
    res.status(500).json({ error: true, message: 'Erro interno.' });
  }
});

app.post('/api/auth/verify-email', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET) as { email: string };
    
    await prisma.user.update({ 
      where: { email: decoded.email }, 
      data: { isVerified: true } 
    });
    
    res.json({ data: { success: true } });
  } catch (error) {
    res.status(400).json({ error: true, message: 'Token inválido ou expirado' });
  }
});

app.get('/api/auth/me', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const user = await prisma.user.findUnique({ 
    where: { id: authReq.user!.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      cpf: true,
      phone: true,
      address: true,
      birthDate: true,
      isVerified: true
    }
  });
  
  if (!user) return res.status(404).json({ error: true, message: 'Usuário não encontrado' });
  res.json({ data: { user } });
});

app.patch('/api/auth/profile', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { cpf, phone, address, birthDate } = req.body;
  
  const user = await prisma.user.update({
    where: { id: authReq.user!.id },
    data: { cpf, phone, address, birthDate },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      cpf: true,
      phone: true,
      address: true,
      birthDate: true,
      isVerified: true
    }
  });
  
  res.json({ data: { user } });
});

app.post('/api/auth/social', async (req: Request, res: Response) => {
  try {
    const { provider, token } = req.body;
    let email = '';
    let name = '';
    let googleId = undefined;

    if (provider === 'google') {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: GOOGLE_CLIENT_ID,
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) throw new Error("Token Google inválido");
        
        email = payload.email;
        name = payload.name || 'Usuário Google';
        googleId = payload.sub;
      } catch (e) {
        return res.status(401).json({ error: true, message: "Token Google inválido" });
      }
    } else {
      return res.status(400).json({ error: true, message: "Provedor não suportado" });
    }

    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          isVerified: true,
          googleId,
          role: 'CLIENT'
        }
      });
    } else if (provider === 'google' && !user.googleId) {
      user = await prisma.user.update({ 
        where: { id: user.id }, 
        data: { googleId } 
      });
    }
    
    const appToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ 
      data: { token: appToken, user: { ...user, passwordHash: undefined } } 
    });
  } catch (error) {
    res.status(500).json({ error: true, message: "Erro no login social" });
  }
});

// ===================== ORDER ROUTES =====================

app.get('/api/orders', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const where = authReq.user!.role === 'CLIENT' 
    ? { clientId: authReq.user!.id } 
    : authReq.user!.role === 'ANALYST' 
    ? { analystId: authReq.user!.id } 
    : {};
    
  const orders = await prisma.order.findMany({ 
    where, 
    include: { 
      service: true, 
      client: {
        select: { id: true, name: true, email: true, role: true, phone: true }
      }, 
      analyst: {
        select: { id: true, name: true, email: true, role: true }
      },
      documents: true,
      messages: {
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          }
        }
      }
    }, 
    orderBy: { createdAt: 'desc' } 
  });
  
  res.json({ data: orders });
});

app.get('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const order = await prisma.order.findUnique({
    where: { id: req.params.id },
    include: {
      service: true,
      client: {
        select: { id: true, name: true, email: true, role: true, phone: true }
      },
      analyst: {
        select: { id: true, name: true, email: true, role: true }
      },
      documents: true,
      messages: {
        include: {
          sender: {
            select: { id: true, name: true, email: true, role: true }
          }
        },
        orderBy: { createdAt: 'asc' }
      }
    }
  });
  
  if (!order) return res.status(404).json({ error: true, message: 'Pedido não encontrado' });
  
  // Verificar permissões
  if (authReq.user!.role === 'CLIENT' && order.clientId !== authReq.user!.id) {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  if (authReq.user!.role === 'ANALYST' && order.analystId !== authReq.user!.id) {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  
  res.json({ data: order });
});

app.post('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthRequest;
    const { serviceId, details, description } = req.body;
    
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(400).json({ error: true, message: 'Serviço inválido' });
    
    // Validar detalhes conforme o serviço
    if (serviceId === 'qualified_search') {
      QualifiedSearchDetailsSchema.parse(details);
    }
    // TODO: Adicionar outras validações conforme necessário
    
    const order = await prisma.order.create({
      data: { 
        clientId: authReq.user!.id, 
        serviceId, 
        details: details || {}, 
        description, 
        status: service.basePrice ? 'PENDING' : 'AWAITING_QUOTE', 
        totalAmount: service.basePrice || 0 
      },
      include: { service: true, client: true }
    });
    
    // Notificar admins sobre novo pedido
    await sendWhatsAppMessage(
      process.env.ADMIN_PHONE || '',
      'novo_pedido_admin',
      [order.client.name.split(' ')[0], order.service.name, order.readableId.toString()]
    );
    
    res.status(201).json({ data: order });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: true, message: 'Dados do pedido inválidos', details: error.errors });
    }
    res.status(500).json({ error: true, message: 'Erro ao criar pedido' });
  }
});

app.patch('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { status, totalAmount, analystId } = req.body;
  
  // Apenas admin pode atualizar pedidos
  if (authReq.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { 
      status,
      totalAmount,
      analystId,
      paymentConfirmedAt: status === 'IN_PROGRESS' ? new Date() : undefined
    },
    include: { service: true, client: true, analyst: true }
  });
  
  res.json({ data: order });
});

app.patch('/api/orders/:id/quote', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { price } = req.body;
  
  if (authReq.user!.role !== 'ADMIN' && authReq.user!.role !== 'ANALYST') {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  
  if (!price || price <= 0) {
    return res.status(400).json({ error: true, message: 'Preço inválido' });
  }
  
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { 
      totalAmount: price,
      status: 'PENDING'
    },
    include: { service: true, client: true }
  });
  
  // Criar mensagem do sistema
  await prisma.message.create({
    data: {
      orderId: order.id,
      senderId: authReq.user!.id,
      content: `Orçamento definido: R$ ${price.toFixed(2).replace('.', ',')}. Você já pode realizar o pagamento.`
    }
  });
  
  // Notificar cliente
  await sendEmail(
    order.client.email,
    `Orçamento Disponível - Pedido #${order.readableId}`,
    `<p>Olá ${order.client.name},</p>
     <p>O orçamento para o serviço "${order.service.name}" está disponível.</p>
     <p><strong>Valor: R$ ${price.toFixed(2).replace('.', ',')}</strong></p>
     <p>Acesse a plataforma para realizar o pagamento.</p>`
  );
  
  res.json({ data: order });
});

app.patch('/api/orders/:id/assign', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { analystId } = req.body;
  
  if (authReq.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  
  const analyst = await prisma.user.findUnique({ 
    where: { id: analystId, role: 'ANALYST' } 
  });
  
  if (!analyst) {
    return res.status(400).json({ error: true, message: 'Analista inválido' });
  }
  
  const order = await prisma.order.update({
    where: { id: req.params.id },
    data: { 
      analystId,
      status: 'IN_PROGRESS'
    },
    include: { service: true, client: true, analyst: true }
  });
  
  res.json({ data: order });
});

app.post('/api/orders/:id/upload', authenticate, upload.single('file'), async (req: Request, res: Response) => {
  if (!req.file) return res.status(400).json({ error: true, message: 'Arquivo ausente' });
  
  try {
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) return res.status(404).json({ error: true, message: 'Pedido não encontrado' });
    
    const s3Key = await uploadFileToS3(req.file, `orders/${req.params.id}`);
    const doc = await prisma.document.create({
      data: { 
        orderId: req.params.id, 
        name: req.file.originalname, 
        mimeType: req.file.mimetype, 
        size: req.file.size, 
        s3Key 
      }
    });
    
    res.status(201).json({ data: doc });
  } catch (error) {
    res.status(500).json({ error: true, message: "Erro ao fazer upload" });
  }
});

app.post('/api/orders/:id/messages', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { content } = req.body;
  
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: true, message: 'Mensagem vazia' });
  }
  
  const order = await prisma.order.findUnique({ 
    where: { id: req.params.id },
    select: { clientId: true, analystId: true }
  });
  
  if (!order) return res.status(404).json({ error: true, message: 'Pedido não encontrado' });
  
  // Verificar permissões
  const userRole = authReq.user!.role;
  const userId = authReq.user!.id;
  if (userRole === 'CLIENT' && order.clientId !== userId) {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  if (userRole === 'ANALYST' && order.analystId !== userId) {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  
  const message = await prisma.message.create({
    data: {
      orderId: req.params.id,
      senderId: authReq.user!.id,
      content
    },
    include: {
      sender: {
        select: { id: true, name: true, email: true, role: true }
      }
    }
  });
  
  res.status(201).json({ data: message });
});

// ===================== PAYMENT ROUTES =====================

app.post('/api/payments', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  const { orderId } = req.body;
  
  const order = await prisma.order.findUnique({
    where: { id: orderId, clientId: authReq.user!.id },
    include: { client: true }
  });
  
  if (!order) return res.status(404).json({ error: true, message: 'Pedido não encontrado' });
  if (Number(order.total) === 0) return res.status(400).json({ error: true, message: 'Pedido sem valor definido' });
  
  try {
    const pixData = await createPixPayment(
      orderId,
      Number(order.totalAmount),
      order.client.email,
      order.client.name.split(' ')[0]
    );
    
    // Salvar ID do pagamento
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentId: pixData.id?.toString() }
    });
    
    res.json({ 
      data: {
        qrCodeUrl: pixData.qr_code_base64 ? `data:image/png;base64,${pixData.qr_code_base64}` : '',
        pixCopyPaste: pixData.qr_code || ''
      }
    });
  } catch (error) {
    res.status(500).json({ error: true, message: 'Erro ao gerar PIX' });
  }
});

// Webhook Mercado Pago
app.post('/api/webhooks/mp', async (req: Request, res: Response) => {
  const { action, data } = req.body;
  
  if (action === 'payment.created' || action === 'payment.updated') {
    try {
      // Buscar detalhes do pagamento na API do MP
      const paymentId = data.id;
      const mpResponse = await axios.get(
        `https://api.mercadopago.com/v1/payments/${paymentId}`,
        { headers: { Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}` } }
      );
      
      const payment = mpResponse.data;
      
      if (payment.status === 'approved') {
        // Buscar pedido pelo external_reference
        const order = await prisma.order.findFirst({
          where: { id: payment.external_reference },
          include: { service: true, client: true }
        });
        
        if (order && order.status === 'PENDING') {
          // Atualizar status do pedido
          await prisma.order.update({
            where: { id: order.id },
            data: {
              status: 'IN_PROGRESS',
              paymentMethod: payment.payment_method_id,
              paymentConfirmedAt: new Date()
            }
          });
          
          // Notificar cliente
          await sendEmail(
            order.client.email,
            `Pagamento Confirmado - Pedido #${order.readableId}`,
            `<p>Olá ${order.client.name},</p>
             <p>Seu pagamento foi confirmado! Um analista iniciará o trabalho em breve.</p>`
          );
          
          // Notificar WhatsApp se houver telefone
          if (order.client.phone) {
            await sendWhatsAppMessage(
              order.client.phone,
              'pagamento_confirmado',
              [order.client.name.split(' ')[0], order.readableId.toString()]
            );
          }
        }
      }
      
      res.sendStatus(200);
    } catch (error) {
      console.error('Erro no webhook MP:', error);
      res.sendStatus(200); // Sempre retornar 200 para evitar retry
    }
  } else {
    res.sendStatus(200);
  }
});

// ===================== ADMIN ROUTES =====================

app.get('/api/admin/stats', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthRequest;
  if (authReq.user!.role !== 'ADMIN') {
    return res.status(403).json({ error: true, message: 'Sem permissão' });
  }
  
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  
  const [totalOrders, monthlyRevenue, ordersByStatus] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({
      where: {
        status: 'COMPLETED',
        paymentConfirmedAt: { gte: startOfMonth }
      },
      _sum: { totalAmount: true }
    }),
    prisma.order.groupBy({
      by: ['status'],
      _count: true
    })
  ]);
  
  res.json({
    data: {
      totalOrders,
      monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
      ordersByStatus
    }
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: true, 
    message: process.env.NODE_ENV === 'production' ? 'Erro interno' : err.message 
  });
});

// Start server
app.listen(PORT, () => console.log(`✅ Server rodando na porta ${PORT}`));
