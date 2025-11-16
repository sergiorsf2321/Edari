import { Router } from 'express';
import {
  createOrder,
  getOrders,
  getOrderById,
  assignAnalyst,
  sendQuote,
  updateOrderStatus
} from '../controllers/orderController';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/', createOrder);
router.get('/', getOrders);
router.get('/:id', getOrderById);
router.put('/:id/assign', authorize('ADMIN'), assignAnalyst);
router.post('/:id/quote', authorize('ADMIN', 'ANALYST'), sendQuote);
router.put('/:id/status', authorize('ADMIN', 'ANALYST'), updateOrderStatus);

export default router;
