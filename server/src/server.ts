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
// CORREÇÃO 1: Importar OrderStatus e Prisma para tipagem correta
import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret-dev';
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);

// Extend Request type
interface AuthRequest extends express.Request {
    user?: any;
    file?: any;
}

// Middleware Setup
app.use(helmet());
app.use(cors({ origin: '*' })); // Permitir desenvolvimento local
app.use(express.json());

// Rate Limiting (Relaxado para dev)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 500 
});
app.use(limiter);

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Middleware de Autenticação
const authenticate = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token ausente' });
  
  const token = authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Token malformado' });

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};

// --- ROUTES ---

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

// Auth: Register
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
    
    // Tenta enviar email, mas não falha o request se der erro no SES simulado
    sendEmail(email, "Confirme seu cadastro", "Bem-vindo à Edari!").catch(console.error);
    
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    
    // Remove hash da resposta
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ token, user: userWithoutPassword });
  } catch (error: any) { 
      console.error("Register Error:", error);
      res.status(500).json({ message: 'Erro ao registrar usuário.' }); 
  }
});

// Auth: Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) return res.status(401).json({ message: 'Credenciais inválidas.' });
    if (!user.passwordHash) return res.status(401).json({ message: 'Use o login social para esta conta.' });
    
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

// Auth: Get Me
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

// Auth: Update Profile
app.patch('/api/auth/profile', authenticate, async (req, res) => {
    const authReq = req as AuthRequest;
    const { cpf, address, phone } = req.body;
    try {
        const updatedUser = await prisma.user.update({
            where: { id: authReq.user.id },
            data: { cpf, address, phone }
        });
        const { passwordHash: _, ...userWithoutPassword } = updatedUser;
        res.json(userWithoutPassword);
    } catch (error) {
        res.status(500).json({ message: "Erro ao atualizar perfil" });
    }
});

// Orders: List
app.get('/api/orders', authenticate, async (req, res) => {
    const authReq = req as AuthRequest;
    try {
        // CORREÇÃO 2: Tipagem explícita do WhereInput
        let where: Prisma.OrderWhereInput = {};

        if (authReq.user.role === 'CLIENT') {
            where = { clientId: authReq.user.id };
        } else if (authReq.user.role === 'ANALYST') {
            where = { 
                OR: [
                    { analystId: authReq.user.id }, 
                    // CORREÇÃO 3: Uso do Enum OrderStatus
                    { status: OrderStatus.PENDING } 
                ] 
            };
        }
        // Se for ADMIN, mantém {} (busca tudo)
                
        const orders = await prisma.order.findMany({ 
            where, 
            include: { service: true, client: true, analyst: true, messages: { include: { sender: true } }, documents: true }, 
            orderBy: { createdAt: 'desc' } 
        });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao buscar pedidos" });
    }
});

// Orders: Create
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
        console.error(error);
        res.status(500).json({ message: "Erro ao criar pedido: " + error.message });
    }
});

// Orders: Upload
app.post('/api/orders/:id/upload', authenticate, upload.single('file'), async (req: any, res: any) => {
    const authReq = req as AuthRequest;
    if (!authReq.file) return res.status(400).json({ message: 'Arquivo ausente' });
    
    try {
        const publicUrl = await uploadFileToS3(authReq.file, `orders/${req.params.id}`);
        
        const doc = await prisma.document.create({
            data: { 
                orderId: req.params.id, 
                name: authReq.file.originalname, 
                mimeType: authReq.file.mimetype, 
                size: authReq.file.size, 
                s3Key: publicUrl 
            }
        });
        res.status(201).json(doc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao fazer upload" });
    }
});

// Orders: Send Message
app.post('/api/orders/:id/messages', authenticate, async (req, res) => {
    const authReq = req as AuthRequest;
    const { content } = req.body;
    try {
        const message = await prisma.message.create({
            data: {
                orderId: req.params.id,
                senderId: authReq.user.id,
                content
            },
            include: { sender: true }
        });
        res.status(201).json(message);
    } catch (error) {
        res.status(500).json({ message: "Erro ao enviar mensagem" });
    }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
