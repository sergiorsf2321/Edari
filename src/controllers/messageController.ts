import { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';

const prisma = new PrismaClient();

export const sendMessage = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const { content, attachment } = req.body;
    const userId = req.user!.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ error: 'Mensagem não pode estar vazia' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const hasAccess =
      req.user!.role === 'ADMIN' ||
      order.clientId === userId ||
      order.analystId === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const message = await prisma.message.create({
      data: {
        orderId,
        senderId: userId,
        content,
        attachment
      },
      include: {
        sender: true
      }
    });

    if (attachment) {
      const currentDocs = order.documents as any[];
      await prisma.order.update({
        where: { id: orderId },
        data: {
          documents: [...currentDocs, attachment],
          updatedAt: new Date()
        }
      });
    }

    return res.status(201).json(message);
  } catch (error) {
    console.error('Error in sendMessage:', error);
    return res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};

export const getMessages = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.params;
    const userId = req.user!.id;

    const order = await prisma.order.findUnique({
      where: { id: orderId }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    const hasAccess =
      req.user!.role === 'ADMIN' ||
      order.clientId === userId ||
      order.analystId === userId;

    if (!hasAccess) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    const messages = await prisma.message.findMany({
      where: { orderId },
      include: { sender: true },
      orderBy: { createdAt: 'asc' }
    });

    return res.json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error);
    return res.status(500).json({ error: 'Erro ao buscar mensagens' });
  }
};
