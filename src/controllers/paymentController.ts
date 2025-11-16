import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { createPreference } from '../services/mercadoPago';

const prisma = new PrismaClient();

export const createPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { orderId } = req.body;

    if (!orderId) {
      return res.status(400).json({ error: 'ID do pedido é obrigatório' });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { service: true, client: true }
    });

    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (order.clientId !== req.user!.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    if (order.status !== 'PENDING') {
      return res.status(400).json({ error: 'Pedido não está pendente de pagamento' });
    }

    const preference = await createPreference(
      order.id,
      order.total,
      `EDARI - ${order.service.name}`,
      order.client.email
    );

    await prisma.payment.create({
      data: {
        orderId: order.id,
        amount: order.total,
        status: 'PENDING',
        paymentMethod: 'MERCADO_PAGO'
      }
    });

    return res.json({
      preferenceId: preference.id,
      initPoint: preference.init_point
    });
  } catch (error) {
    console.error('Error in createPayment:', error);
    return res.status(500).json({ error: 'Erro ao criar pagamento' });
  }
};
