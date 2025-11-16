import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { getUploadUrl } from '../controllers/uploadController';

const router = Router();

router.post('/generate-url', authenticate, getUploadUrl);

export default router;
