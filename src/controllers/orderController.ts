import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const createOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { serviceId, description, documents, propertyType, isUrgent } = req.body;
    const userId = req.user!.id;

    if (!serviceId || !description) {
      return res.status(400).json({ error: 'Serviço e descrição são obrigatórios' });
    }

    const service = await prisma.service.findUnique({
      where: { id: serviceId }
    });

    if (!service) {
      return res.status(404).json({ error: 'Serviço não encontrado' });
    }

    const order = await prisma.order.create({
      data: {
        clientId: userId,
        serviceId,
        description,
        documents: documents || [],
        propertyType,
        isUrgent: isUrgent || false,
        status: service.price === null ? 'AWAITING_QUOTE' : 'PENDING',
        total: service.price || 0
      },
      include: {
        client: true,
        service: true,
        messages: { include: { sender: true } }
      }
    });

    return res.status(201).json(order);
  } catch (error) {
    console.error('Error in createOrder:', error);
    return res.status(500).json({ error: 'Erro ao criar pedido' });
  }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    let where: any = {};

    if (user.role === 'CLIENT') {
      where = { clientId: user.id };
    } else if (user.role === 'ANALYST') {
      where = { analystId: user.id };
    }

    const orders = await prisma.order.findMany({
      where,
      include: {
        client: true,
        analyst: true,
        service: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json(orders);
  } catch (error) {
    console.error('Error in getOrders:', error);
    return res.status(500).json({ error: 'Erro ao buscar pedidos' });
  }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = req.user!;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        client: true,
        analyst: true,
        service: true,
        messages: {
          include: { sender: true },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const hasAccess =
      user.role === 'ADMIN' ||
      order.clientId === user.id ||
      order.analystId === user.id;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    return res.json(order);
  } catch (error) {
    console.error('Error in getOrderById:', error);
    return res.status(500).json({ error: 'Erro ao buscar pedido' });
  }
};

export const assignAnalyst = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { analystId } = req.body;

    const analyst = await prisma.user.findUnique({
      where: { id: analystId }
    });

    if (!analyst || analyst.role !== 'ANALYST') {
      return res.status(400).json({ error: 'Analista inválido' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        analystId,
        status: 'IN_PROGRESS'
      },
      include: {
        client: true,
        analyst: true,
        service: true
      }
    });

    return res.json(order);
  } catch (error) {
    console.error('Error in assignAnalyst:', error);
    return res.status(500).json({ error: 'Erro ao atribuir analista' });
  }
};

export const sendQuote = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Valor inválido' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: {
        total: amount,
        status: 'PENDING'
      },
      include: { service: true, client: true }
    });

    await prisma.message.create({
      data: {
        orderId: id,
        senderId: req.user!.id,
        content: `Orçamento enviado: R$ ${amount.toFixed(2).replace('.', ',')}`
      }
    });

    return res.json(order);
  } catch (error) {
    console.error('Error in sendQuote:', error);
    return res.status(500).json({ error: 'Erro ao enviar orçamento' });
  }
};

export const updateOrderStatus = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['AWAITING_QUOTE', 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Status inválido' });
    }

    const order = await prisma.order.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        analyst: true,
        service: true
      }
    });

    return res.json(order);
  } catch (error) {
    console.error('Error in updateOrderStatus:', error);
    return res.status(500).json({ error: 'Erro ao atualizar status' });
  }
};
