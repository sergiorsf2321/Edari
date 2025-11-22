import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { uploadFileToS3 } from './services/s3';
import { sendEmail } from './services/ses';
import { sendWhatsAppMessage } from './services/whatsapp';
import { createPixPayment } from './services/mercadopago';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev';

app.use(helmet() as any);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter as any);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*', 
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}) as any);

app.use(express.json() as any);

const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }
});

const authenticate = (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// --- ROTAS ---

app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { name, email, password, cpf, phone, address, birthDate } = req.body;
    
    if (!email || !name) return res.status(400).json({ message: 'Dados incompletos.' });

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
    console.error("Erro no registro:", error);
    res.status(500).json({ message: 'Erro interno ao criar conta.' });
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    if (!user.passwordHash) return res.status(401).json({ message: 'Use o login social.' });

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: 'Credenciais inválidas.' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) {
    console.error("Erro no login:", error);
    res.status(500).json({ message: 'Erro interno no login.' });
  }
});

app.patch('/api/auth/profile', authenticate, async (req: any, res: any) => {
    try {
        const { cpf, address, phone } = req.body;
        const updated = await prisma.user.update({ where: { id: req.user.id }, data: { cpf, address, phone } });
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar perfil' });
    }
});

app.get('/api/orders', authenticate, async (req: any, res: any) => {
  try {
      const { id, role } = req.user;
      const where = role === 'CLIENT' ? { clientId: id } : role === 'ANALYST' ? { analystId: id } : {};
      const orders = await prisma.order.findMany({ where, include: { service: true, client: true, analyst: true }, orderBy: { createdAt: 'desc' } });
      res.json(orders);
  } catch (error) {
      res.status(500).json({ message: "Erro ao buscar pedidos" });
  }
});

app.get('/api/orders/:id', authenticate, async (req: any, res: any) => {
    try {
        const order = await prisma.order.findUnique({
            where: { id: req.params.id },
            include: { service: true, client: true, analyst: true, documents: true, messages: { include: { sender: true }, orderBy: { createdAt: 'asc' } } }
        });
        if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });
        
        if (req.user.role === 'CLIENT' && order.clientId !== req.user.id) {
            return res.status(403).json({ message: 'Acesso negado' });
        }
        
        res.json(order);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar detalhes" });
    }
});

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

app.post('/api/orders/:id/upload', authenticate, upload.single('file') as any, async (req: any, res: any) => {
    try {
        if (!req.file) return res.status(400).json({ message: 'Arquivo ausente' });
        
        const publicUrl = await uploadFileToS3(req.file, `orders/${req.params.id}`);
        
        const doc = await prisma.document.create({
            data: { orderId: req.params.id, name: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, s3Key: publicUrl }
        });
        res.status(201).json(doc);
    } catch (error: any) {
        if (error.code === 'LIMIT_FILE_SIZE') {
             return res.status(400).json({ message: 'Arquivo muito grande. Limite de 5MB.' });
        }
        console.error("Upload Error:", error);
        res.status(500).json({ message: 'Falha no upload' });
    }
});

app.patch('/api/orders/:id', authenticate, async (req: any, res: any) => {
    try {
        const updated = await prisma.order.update({ where: { id: req.params.id }, data: req.body, include: { client: true, service: true } });
        
        if (req.body.status === 'PENDING' && updated.totalAmount > 0 && updated.client.phone) {
            await sendWhatsAppMessage(updated.client.phone, 'orcamento_disponivel', [updated.client.name.split(' ')[0], updated.id, updated.totalAmount.toString()]);
        }
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar' });
    }
});

app.post('/api/orders/:id/messages', authenticate, async (req: any, res: any) => {
    try {
        const message = await prisma.message.create({
            data: { orderId: req.params.id, senderId: req.user.id, content: req.body.content },
            include: { sender: true }
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao enviar mensagem' });
    }
});

app.post('/api/payments', authenticate, async (req: any, res: any) => {
    try {
        const { orderId } = req.body;
        const order = await prisma.order.findUnique({ where: { id: orderId }, include: { client: true } });
        
        if (!order) return res.status(404).json({ message: 'Pedido não encontrado' });

        const pix = await createPixPayment(order.id, Number(order.totalAmount), order.client.email, order.client.name);
        
        await prisma.order.update({ where: { id: orderId }, data: { paymentId: pix.id.toString(), paymentMethod: 'pix' } });
        
        res.json({ qrCodeUrl: `data:image/png;base64,${pix.qr_code_base64}`, pixCopyPaste: pix.qr_code });
    } catch (error: any) {
        res.status(500).json({ message: error.message || 'Erro no pagamento' });
    }
});

app.post('/api/webhooks/mp', async (req: any, res: any) => {
    try {
        console.log("Webhook MP recebido:", req.body);
        res.sendStatus(200);
    } catch (e) {
        console.error("Erro webhook:", e);
        res.sendStatus(500);
    }
});

app.use((err: any, req: any, res: any, next: any) => {
    console.error("[CRITICAL SERVER ERROR]", err);
    res.status(500).json({ message: "Erro interno crítico no servidor." });
});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
