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
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

// Middleware Setup
app.use(helmet());
app.use(cors({ origin: '*' })); // Permite conexões locais e externas
app.use(express.json());

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500 
});
app.use(limiter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Tipagem extendida
interface AuthRequest extends express.Request {
    user?: any;
    file?: any;
}

// Middleware de Autenticação
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });
  
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Health Check
app.get('/', (req, res) => { res.send('✅ Edari API está online!'); });

// Status Check
app.get('/api/status', async (req, res) => {
    try {
        const userCount = await prisma.user.count();
        res.json({ online: true, database: 'connected', userCount });
    } catch (error: any) {
        console.error("DB Error:", error);
        res.status(500).json({ online: true, database: 'error', message: error.message });
    }
});

// --- AUTH ROUTES ---

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, cpf, phone, address, birthDate } = req.body;
    
    if (!email || !name || !password) return res.status(400).json({ message: 'Dados incompletos.' });
    
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(400).json({ message: 'E-mail já cadastrado.' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    
    const user = await prisma.user.create({ 
        data: { name, email, passwordHash, cpf, phone, address, birthDate, role: 'CLIENT' } 
    });
    
    // Envio de email não bloqueante
    sendEmail(email, "Confirme seu cadastro", "Bem-vindo à Edari!").catch(console.error);
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error: any) { 
      console.error("Register Error:", error);
      res.status(500).json({ message: 'Erro ao registrar usuário.' }); 
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    if (!user.passwordHash) return res.status(401).json({ message: 'Conta Google/Social. Use o botão correspondente.' });
    
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) return res.status(401).json({ message: 'Credenciais inválidas.' });
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) { 
      console.error("Login Error:", error);
      res.status(500).json({ message: 'Erro no servidor.' }); 
  }
});

// Rota essencial para persistência de login
app.get('/api/auth/me', authenticate, async (req, res) => {
    const authReq = req as AuthRequest;
    try {
        const user = await prisma.user.findUnique({ where: { id: authReq.user.id } });
        if (!user) return res.status(404).json({ message: 'Usuário não encontrado' });
        
        const { passwordHash: _, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar perfil' });
    }
});

// --- ORDER ROUTES ---

app.get('/api/orders', authenticate, async (req, res) => {
    const authReq = req as AuthRequest;
    try {
        const where = authReq.user.role === 'CLIENT' 
            ? { clientId: authReq.user.id } 
            : authReq.user.role === 'ANALYST' 
                ? { OR: [{ analystId: authReq.user.id }, { status: 'PENDING' }] } 
                : {}; 
                
        const orders = await prisma.order.findMany({ 
            where, 
            include: { service: true, client: true, analyst: true, messages: { include: { sender: true } }, documents: true }, 
            orderBy: { createdAt: 'desc' } 
        });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
});

app.post('/api/orders', authenticate, async (req, res) => {
    const authReq = req as AuthRequest;
    const { serviceId, details, description } = req.body;
    
    try {
        const service = await prisma.service.findUnique({ where: { id: serviceId } });
        if (!service) return res.status(400).json({ message: 'Serviço inválido' });
        
        const order = await prisma.order.create({
            data: { 
                clientId: authReq.user.id, 
                serviceId, 
                details: details || {}, 
                description, 
                status: service.basePrice ? 'PENDING' : 'AWAITING_QUOTE', 
                totalAmount: service.basePrice || 0 
            }
        });
        
        const fullOrder = await prisma.order.findUnique({
             where: { id: order.id },
             include: { service: true, client: true }
        });
        res.status(201).json(fullOrder);
    } catch (error: any) {
        res.status(500).json({ message: "Erro ao criar pedido: " + error.message });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));