import { Router } from 'express';
import { register, login, googleSignIn, me } from '../controllers/authController';
import { authenticate } from '../middleware/auth';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/google-signin', googleSignIn);
router.get('/me', authenticate, me);

export default router;
