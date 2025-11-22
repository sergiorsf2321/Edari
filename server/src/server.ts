
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

// Rota Raiz para Health Check (Evita Cannot GET /)
app.get('/', (req: any, res: any) => {
    res.send('✅ Edari API está online e funcionando!');
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
  } catch (error) { res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/api/auth/login', async (req: any, res: any) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash || !(await bcrypt.compare(password, user.passwordHash))) {
        return res.status(401).json({ message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user });
  } catch (error) { res.status(500).json({ message: 'Erro interno.' }); }
});

app.post('/api/auth/verify-email', async (req: any, res: any) => {
    // Simulação: Em produção, validar token enviado por email
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
    // Nota: Em produção, você deve validar o token com o Google/Apple aqui
    // usando google-auth-library ou jsonwebtoken
    const { provider, token } = req.body;
    
    // Mock de decodificação (Na vida real, decodifique o token JWT do provider)
    // const decoded = jwt.decode(token); 
    
    // Vamos simular que pegamos o email do token
    const email = `social_user_${Date.now()}@example.com`; // Placeholder
    
    let user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
       user = await prisma.user.create({
           data: {
               email,
               name: "Usuário Social",
               isVerified: true,
               googleId: provider === 'google' ? 'google_id_placeholder' : undefined,
               appleId: provider === 'apple' ? 'apple_id_placeholder' : undefined
           }
       });
    }
    
    const appToken = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token: appToken, user });
    
  } catch (error) {
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
    
    // Notificar analistas (opcional)
    // sendEmail("admin@edari.com.br", "Novo Pedido", `Pedido #${order.id} criado.`);
    
    res.status(201).json(order);
});

app.post('/api/orders/:id/upload', authenticate, upload.single('file') as any, async (req: any, res: any) => {
    if (!req.file) return res.status(400).json({ message: 'Arquivo ausente' });
    const publicUrl = await uploadFileToS3(req.file, `orders/${req.params.id}`);
    const doc = await prisma.document.create({
        data: { orderId: req.params.id, name: req.file.originalname, mimeType: req.file.mimetype, size: req.file.size, s3Key: publicUrl }
    });
    res.status(201).json(doc);
});

// Webhook MP
app.post('/api/webhooks/mp', async (req: any, res: any) => {
    console.log("Webhook MP recebido:", req.body);
    
    // Lógica básica de tratamento:
    // 1. Pegar ID do pagamento (req.body.data.id)
    // 2. Consultar API do Mercado Pago para confirmar status === 'approved'
    // 3. Atualizar status do pedido no banco
    
    // Como não temos a consulta implementada aqui para brevidade, retornamos 200 OK
    res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on ${PORT}`));
