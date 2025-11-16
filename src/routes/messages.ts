import { Router } from 'express';
import { sendMessage, getMessages } from '../controllers/messageController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.post('/:orderId', sendMessage);
router.get('/:orderId', getMessages);

export default router;
