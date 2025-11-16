import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { getPaymentInfo } from '../services/mercadoPago';

const prisma = new PrismaClient();

export const mercadoPagoWebhook = async (req: Request, res: Response) => {
  try {
    const { type, data } = req.body;

    console.log('📥 Webhook received:', { type, data });

    if (type === 'payment') {
      const paymentId = data.id;
      
      const paymentInfo = await getPaymentInfo(paymentId);
      
      console.log('💳 Payment info:', paymentInfo);

      if (paymentInfo.status === 'approved') {
        const orderId = paymentInfo.external_reference;
        
        await prisma.order.update({
          where: { id: orderId },
          data: { 
            status: 'IN_PROGRESS',
            updatedAt: new Date()
          }
        });

        await prisma.payment.updateMany({
          where: { orderId },
          data: {
            status: 'APPROVED',
            mercadoPagoId: String(paymentId)
          }
        });

        console.log('✅ Payment approved and order updated');
      }
    }

    return res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Error in webhook:', error);
    return res.status(200).send('OK');
  }
};
