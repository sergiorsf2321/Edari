import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { createPayment } from '../controllers/paymentController';
import { mercadoPagoWebhook } from '../controllers/webhookController';

const router = Router();

router.post('/create', authenticate, createPayment);
router.post('/webhook', mercadoPagoWebhook);

export default router;
