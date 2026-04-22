// src/routes/auth.ts
import { Router } from 'express';
import { login, me, changePassword } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/login',           login);
router.get ('/me',              authMiddleware, me);
router.post('/change-password', authMiddleware, changePassword);

export default router;
