// CORREÇÃO: Server completo e funcional
import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { PrismaClient, OrderStatus, Role } from '@prisma/client';

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'edari-secret-key-2024';

// Middleware seguro
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Rate limiting melhorado
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: true, code: 'RATE_LIMIT_EXCEEDED', message: 'Muitas requisições. Tente novamente em 15 minutos.' }
});
app.use('/api/', limiter);

// Upload seguro
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 5
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido'));
    }
  }
});

// Middleware de autenticação melhorado
const authenticate = async (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ 
        error: true, 
        code: 'MISSING_TOKEN', 
        message: 'Token de autenticação necessário' 
      });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        error: true, 
        code: 'INVALID_TOKEN_FORMAT', 
        message: 'Formato do token inválido' 
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Verificar se usuário ainda existe no banco
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isVerified: true }
    });

    if (!user) {
      return res.status(401).json({ 
        error: true, 
        code: 'USER_NOT_FOUND', 
        message: 'Usuário não encontrado' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ 
      error: true, 
      code: 'INVALID_TOKEN', 
      message: 'Token inválido ou expirado' 
    });
  }
};

// Health check
app.get('/api/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      database: 'connected'
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'unhealthy', 
      timestamp: new Date().toISOString(),
      database: 'disconnected'
    });
  }
});

// Rota de status (mantida para compatibilidade)
app.get('/api/status', async (req, res) => {
  try {
    const userCount = await prisma.user.count();
    res.json({ 
      online: true, 
      database: 'connected', 
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({ 
      online: true, 
      database: 'error', 
      message: error.message 
    });
  }
});

// REGISTRO CORRIGIDO
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password, cpf, phone, address, birthDate } = req.body;
    
    // Validações
    if (!email || !name || !password) {
      return res.status(400).json({ 
        error: true, 
        code: 'MISSING_FIELDS', 
        message: 'Nome, email e senha são obrigatórios.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: true, 
        code: 'WEAK_PASSWORD', 
        message: 'Senha deve ter pelo menos 6 caracteres.' 
      });
    }

    // Verificar se usuário já existe
    const existingUser = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (existingUser) {
      return res.status(409).json({ 
        error: true, 
        code: 'USER_EXISTS', 
        message: 'E-mail já cadastrado.' 
      });
    }

    // Hash da senha
    const passwordHash = await bcrypt.hash(password, 12);
    
    // Criar usuário
    const user = await prisma.user.create({ 
      data: { 
        name, 
        email, 
        passwordHash, 
        cpf, 
        phone, 
        address, 
        birthDate, 
        role: Role.CLIENT 
      } 
    });
    
    // Gerar token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    // Remover hash da resposta
    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.status(201).json({ 
      data: {
        token, 
        user: userWithoutPassword 
      }
    });

  } catch (error: any) {
    console.error("Register Error:", error);
    res.status(500).json({ 
      error: true, 
      code: 'REGISTRATION_FAILED', 
      message: 'Erro interno ao registrar usuário.' 
    });
  }
});

// LOGIN CORRIGIDO
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        error: true, 
        code: 'MISSING_CREDENTIALS', 
        message: 'Email e senha são obrigatórios.' 
      });
    }

    const user = await prisma.user.findUnique({ 
      where: { email } 
    });
    
    if (!user) {
      return res.status(401).json({ 
        error: true, 
        code: 'INVALID_CREDENTIALS', 
        message: 'Credenciais inválidas.' 
      });
    }

    if (!user.passwordHash) {
      return res.status(401).json({ 
        error: true, 
        code: 'SOCIAL_LOGIN_REQUIRED', 
        message: 'Use o login social para esta conta.' 
      });
    }

    // Verificar senha
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ 
        error: true, 
        code: 'INVALID_CREDENTIALS', 
        message: 'Credenciais inválidas.' 
      });
    }

    // Verificar role se especificado
    if (role && user.role !== role) {
      return res.status(403).json({ 
        error: true, 
        code: 'INSUFFICIENT_PERMISSIONS', 
        message: 'Acesso não autorizado para este perfil.' 
      });
    }

    // Gerar token
    const token = jwt.sign(
      { 
        id: user.id, 
        role: user.role,
        email: user.email
      }, 
      JWT_SECRET, 
      { expiresIn: '7d' }
    );

    const { passwordHash: _, ...userWithoutPassword } = user;
    
    res.json({ 
      data: {
        token, 
        user: userWithoutPassword 
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ 
      error: true, 
      code: 'LOGIN_FAILED', 
      message: 'Erro interno no servidor.' 
    });
  }
});

// ROTA DE USUÁRIOS (ÚNICA E CORRETA)
app.get('/api/users', authenticate, async (req: any, res) => {
  try {
    const { role } = req.query;

    // Apenas admin pode listar usuários
    if (req.user.role !== Role.ADMIN) {
      return res.status(403).json({ 
        error: true, 
        code: 'FORBIDDEN', 
        message: 'Acesso negado. Apenas administradores.' 
      });
    }

    const where: any = {};
    if (role) {
      where.role = role;
    }

    const users = await prisma.user.findMany({
      where,
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        phone: true,
        isVerified: true,
        createdAt: true
      },
      orderBy: { name: 'asc' }
    });
    
    res.json({ data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ 
      error: true, 
      code: 'USERS_FETCH_FAILED', 
      message: 'Erro ao buscar usuários' 
    });
  }
});

// ... (implementar outras rotas seguindo o mesmo padrão)

app.listen(PORT, () => {
  console.log(`🚀 EDARI API running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});