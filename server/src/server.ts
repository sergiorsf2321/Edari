import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { uploadFileToS3 } from './services/s3';
import { sendEmail } from './services/ses';
import { sendWhatsAppMessage } from './services/whatsapp';
import { createPixPayment } from './services/mercadopago';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev';

const upload = multer({ storage: multer.memoryStorage() });

// Middlewares
app.use(cors() as any); 
app.use(express.json() as any);

// Middleware de Autenticação
const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// --- ROTAS ---

// Cadastro
app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { name, email, password, cpf, phone, address, birthDate } = req.body;
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'E-mail já cadastrado.' });

    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    
    const user = await prisma.user.create({
      data: { name, email, passwordHash, cpf, phone, address, birthDate }
    });

    await sendEmail(email, "Bem-vindo à Edari!", `<h1>Olá ${name}</h1><p>Seu cadastro foi realizado com sucesso.</p>`);
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao criar conta.' });
  }
});

// Login
app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    
    // Se o usuário não tem senha (login social), não pode logar por senha
    if (!user.passwordHash) return res.status(401).json({ message: 'Use o login social.' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    res.status(500).json({ message: 'Erro no login.' });
  }
});

// Atualizar Perfil
app.patch('/api/auth/profile', authenticate, async (req: any, res: any) => {
    try {
        const { cpf, address, phone } = req.body;
        const updated = await prisma.user.update({ where: { id: req.user.id }, data: { cpf, address, phone } });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
});

// Listar Pedidos
app.get('/api/orders', authenticate, async (req: any, res: any) => {
  const { id, role } = req.user;
  const where = role === 'CLIENT' ? { clientId: id } : role === 'ANALYST' ? { analystId: id } : {};
  const orders = await prisma.order.findMany({ where, include: { service: true, client: true, analyst: true }, orderBy: { createdAt: 'desc' } });
  res.json(orders);
});

// Detalhe do Pedido
app.get('/api/orders/:id', authenticate, async (req: any, res: any) => {
    const order = await prisma.order.findUnique({
        where: { id: req.params.id },
        include: { service: true, client: true, analyst: true, documents: true, messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } } }
    });
    if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
    res.json(order);
});

// Criar Pedido
app.post('/api/orders', authenticate, async (req: any, res: any) => {
    try {
        const { serviceId, details, description } = req.body;
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        
        if (!service) return res.status(400).json({ message: 'Serviço inválido' });

        const status = service.basePrice ? 'PENDING' : 'AWAITING_QUOTE';
        const totalAmount = service.basePrice ? Number(service.basePrice) : 0;

        const order = await prisma.order.create({
            data: { clientId: req.user.id, serviceId, details: details || {}, description, status, totalAmount }
        });
        res.status(201).json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Erro ao criar pedido' });
    }
});

// Upload de Arquivo
app.post('/api/orders/:id/upload', authenticate, upload.single('file'), async (req: any, res: any) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Arquivo ausente' });
        const publicUrl = await uploadFileToS3(req.file, `orders/${req.params.id}`);
        const doc = await prisma.document.create({
            data: { orderId: req.params.id, name: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, s3Key: publicUrl }
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ message: 'Falha no upload' });
    }
});

// Atualizar Pedido
app.patch('/api/orders/:id', authenticate, async (req: any, res: any) => {
    try {
        const updated = await prisma.order.update({ where: { id: req.params.id }, data: req.body, include: { client: true, service: true } });
        
        // Gatilho de Notificação (Orçamento Disponível)
        if (req.body.status === 'PENDING' && updated.totalAmount > 0 && updated.client.phone) {
            await sendWhatsAppMessage(updated.client.phone, 'orcamento_disponivel', [updated.client.name.split(' ')[0], updated.id, updated.totalAmount.toString()]);
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar' });
    }
});

// Enviar Mensagem
app.post('/api/orders/:id/messages', authenticate, async (req: any, res: any) => {
    const message = await prisma.message.create({
        data: { orderId: req.params.id, senderId: req.user.id, content: req.body.content },
        include: { sender: true }
    });
    res.status(201).json(message);
});

// Gerar PIX
app.post('/api/payments', authenticate, async (req: any, res: any) => {
    try {
        const { orderId } = req.body;
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { client: true } });
        
        if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

        const pix = await createPixPayment(order.id, Number(order.totalAmount), order.client.email, order.client.name);
        
        await prisma.order.update({ where: { id: orderId }, data: { paymentId: pix.id.toString(), paymentMethod: 'pix' } });
        
        res.json({ qrCodeUrl: `data:image/png;base64,${pix.qr_code_base64}`, pixCopyPaste: pix.qr_code });
    } catch (error) {
        res.status(500).json({ message: 'Erro no pagamento' });
    }
});

// Webhook Mercado Pago
app.post('/api/webhooks/mp', async (req: any, res: any) => {
    console.log("Webhook MP recebido:", req.body);
    // Lógica: Verificar status no MP e atualizar pedido para IN_PROGRESS
    res.sendStatus(200);
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});