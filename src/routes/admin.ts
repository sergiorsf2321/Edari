import { Router } from 'express';
import { promoteToAnalyst, promoteToAdmin } from '../controllers/adminController';

const router = Router();

router.post('/promote-analyst', promoteToAnalyst);
router.post('/promote-admin', promoteToAdmin);

export default router;
