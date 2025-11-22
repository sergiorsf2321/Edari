
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { OAuth2Client } from 'google-auth-library';
import { uploadFileToS3 } from './services/s3';
import { sendEmail } from './services/ses';
import { sendWhatsAppMessage } from './services/whatsapp';
import { createPixPayment } from './services/mercadopago';

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Cliente Google Auth
const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

app.use(helmet() as any);
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }) as any);
app.use(cors({ origin: process.env.FRONTEND_URL || '*' }) as any);
app.use(express.json() as any);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

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

// Rota Raiz para Health Check
app.get('/', (req: any, res: any) => {
    res.send('✅ Edari API está online e funcionando!');
});

// Rota de Diagnóstico (Verifica se o banco foi populado)
app.get('/api/status', async (req: any, res: any) => {
    try {
        const userCount = await prisma.user.count();
        res.json({ 
            online: true, 
            database: 'connected', 
            userCount 
        });
    } catch (error: any) {
        console.error("Erro de conexão com banco:", error);
        res.status(500).json({ 
            online: true, 
            database: 'error', 
            message: error.message 
        });
    }
});

// Auth Routes
app.post('/api/auth/register', async (req: any, res: any) => {
  try {
    const { name, email, password, cpf, phone, address, birthDate } = req.body;
    if (!email || !name) return res.status(400).json({ message: 'Dados incompletos.' });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'E-mail já cadastrado.' });
    
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const user = await prisma.user.create({ data: { name, email, passwordHash, cpf, phone, address, birthDate } });
    
    // Send Confirmation Email
    await sendEmail(email, "Confirme seu cadastro na Edari", `<p>Bem-vindo, ${name}! <a href="#">Clique aqui</a> para confirmar.</p>`);
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user });
  } catch (error) { 
      console.error(error);
      res.status(500).json({ message: 'Erro interno ao registrar.' }); 
  }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
        return res.status(401).json({ message: 'Usuário não encontrado.' });
    }
    
    if (!user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: 'Senha incorreta.' });
    }
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) { 
      console.error("Erro no login:", error);
      res.status(500).json({ message: 'Erro interno no servidor.' }); 
  }
});

app.post('/api/auth/verify-email', async (req: any, res: any) => {
    await prisma.user.update({ where: { email: req.body.email }, data: { isVerified: true } });
    res.json({ success: true });
});

app.post('/api/auth/forgot-password', async (req: any, res: any) => {
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });
    if (user) await sendEmail(user.email, "Recuperação de Senha", "<p>Clique aqui para redefinir...</p>");
    res.json({ message: "Se o email existir, enviamos as instruções." });
});

app.post('/api/auth/social', async (req: any, res: any) => {
  try {
    const { provider, token } = req.body;
    
    if (provider !== 'google') {
        return res.status(400).json({ message: "Apenas Google é suportado neste momento." });
    }

    let email = '';
    let name = '';
    let googleId = undefined;

    // Validação Real do Token Google
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
        console.error("Erro ao validar Google Token:", e);
        return res.status(401).json({ message: "Token Google inválido" });
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
    } else {
        if (!user.googleId) {
            await prisma.user.update({ where: { id: user.id }, data: { googleId } });
        }
    }
    
    const appToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: appToken, user });
    
  } catch (error) {
      console.error("Social login error:", error);
      res.status(500).json({ message: "Erro no login social" });
  }
});

// Order Routes
app.get('/api/orders', authenticate, async (req: any, res: any) => {
    const where = req.user.role === 'CLIENT' ? { clientId: req.user.id } : req.user.role === 'ANALYST' ? { analystId: req.user.id } : {};
    const orders = await prisma.order.findMany({ where, include: { service: true, client: true, analyst: true }, orderBy: { createdAt: 'desc' } });
    res.json(orders);
});

app.post('/api/orders', authenticate, async (req: any, res: any) => {
    const { serviceId, details, description } = req.body;
    const service = await prisma.service.findUnique({ where: { id: serviceId } });
    if (!service) return res.status(400).json({ message: 'Serviço inválido' });
    
    const order = await prisma.order.create({
        data: { 
            clientId: req.user.id, 
            serviceId, 
            details: details || {}, 
            description, 
            status: service.basePrice ? 'PENDING' : 'AWAITING_QUOTE', 
            totalAmount: service.basePrice || 0 
        }
    });
    
    res.status(201).json(order);
});

app.post('/api/orders/:id/upload', authenticate, upload.single('file') as any, async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ message: 'Arquivo ausente' });
    
    try {
        const publicUrl = await uploadFileToS3(req.file, `orders/${req.params.id}`);
        const doc = await prisma.document.create({
            data: { orderId: req.params.id, name: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, s3Key: publicUrl }
        });
        res.status(201).json(doc);
    } catch (error) {
        res.status(500).json({ message: "Erro ao fazer upload" });
    }
});

// Webhook MP
app.post('/api/webhooks/mp', async (req: any, res: any) => {
    console.log("Webhook MP recebido:", req.body);
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
