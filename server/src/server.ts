import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

// --- Configuração ---
const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

app.use(cors());
app.use(express.json());

// --- Middlewares ---

// Estende a interface do Request para incluir o usuário
interface AuthRequest extends Request {
  user?: { id: string; role: string };
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'Token não fornecido' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    (req as AuthRequest).user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// --- Schemas de Validação (Zod) ---
const RegisterSchema = z.object({
  name: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  cpf: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const OrderCreateSchema = z.object({
  serviceId: z.string(),
  details: z.record(z.any()),
  description: z.string().optional(),
  // Documentos seriam tratados via upload separado
});

// --- Rotas de Autenticação ---

app.post('/api/auth/register', async (req: Request, res: Response) => {
  try {
    const data = RegisterSchema.parse(req.body);
    
    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) return res.status(400).json({ error: 'Email já cadastrado' });

    const passwordHash = await bcrypt.hash(data.password, 10);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        passwordHash,
        cpf: data.cpf,
        phone: data.phone,
        address: data.address,
        role: 'CLIENT',
      },
    });

    // TODO: Disparar e-mail de boas-vindas (AWS SES)

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro no cadastro' });
  }
});

app.post('/api/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user || !user.passwordHash) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) return res.status(401).json({ error: 'Credenciais inválidas' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified } });
  } catch (error) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// --- Rotas de Pedidos ---

app.get('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user!;
    let where = {};

    if (user.role === 'CLIENT') {
      where = { clientId: user.id };
    } else if (user.role === 'ANALYST') {
      where = { analystId: user.id };
    }
    // Admin vê tudo (objeto vazio)

    const orders = await prisma.order.findMany({
      where,
      include: {
        service: true,
        client: { select: { id: true, name: true, email: true } },
        analyst: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
});

app.post('/api/orders', authenticate, async (req: Request, res: Response) => {
  try {
    const user = (req as AuthRequest).user!;
    const data = OrderCreateSchema.parse(req.body);

    // Busca o serviço para saber o preço base
    const service = await prisma.service.findUnique({ where: { id: data.serviceId } });
    if (!service) return res.status(404).json({ error: 'Serviço não encontrado' });

    const initialStatus = service.basePrice ? 'PENDING' : 'AWAITING_QUOTE';
    const totalAmount = service.basePrice || 0;

    const order = await prisma.order.create({
      data: {
        clientId: user.id,
        serviceId: data.serviceId,
        details: data.details,
        description: data.description,
        status: initialStatus,
        totalAmount: totalAmount,
      },
    });

    res.status(201).json(order);
  } catch (error: any) {
    res.status(400).json({ error: error.message || 'Erro ao criar pedido' });
  }
});

app.get('/api/orders/:id', authenticate, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        service: true,
        client: true,
        analyst: true,
        documents: true,
        messages: {
          include: { sender: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) return res.status(404).json({ error: 'Pedido não encontrado' });
    
    // Controle de Acesso Básico
    const user = (req as AuthRequest).user!;
    if (user.role === 'CLIENT' && order.clientId !== user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(order);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar detalhes' });
  }
});

// --- Webhook de Pagamento (Mercado Pago) ---

app.post('/api/webhooks/mp', async (req: Request, res: Response) => {
  // Validação de segurança deve ser feita aqui (verificar signature)
  console.log('Webhook Mercado Pago Recebido:', req.body);

  try {
    const { type, data } = req.body;
    if (type === 'payment') {
        // Aqui você consultaria a API do MP para confirmar o status
        // const payment = await mp.payment.get(data.id);
        // if (payment.status === 'approved') ...
        
        // Simulando aprovação: buscar order pela external_reference (que seria o ID do pedido)
        // await prisma.order.update({ where: { id: ... }, data: { status: 'IN_PROGRESS', paymentConfirmedAt: new Date() } });
        
        // TODO: Enviar notificações WhatsApp/Email
    }
    res.status(200).send();
  } catch (error) {
    console.error(error);
    res.status(500).send();
  }
});


// --- Inicialização ---
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});