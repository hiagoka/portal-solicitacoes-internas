import { Router } from 'express';
import { authController } from '../controllers/authController';
import { autenticar } from '../middlewares/autenticar';
import { limitarLogin } from '../middlewares/limitarLogin';
import { validar } from '../middlewares/validar';
import { loginSchema } from '../schemas/auth.schema';

export const authRoutes = Router();

authRoutes.post('/auth/login', limitarLogin, validar(loginSchema), authController.login);
authRoutes.get('/auth/me', autenticar, authController.me);
authRoutes.post('/auth/logout', authController.logout);
