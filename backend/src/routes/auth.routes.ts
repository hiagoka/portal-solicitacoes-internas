import { Router } from 'express';
import { authController } from '../controllers/authController';
import { validar } from '../middlewares/validar';
import { loginSchema } from '../schemas/auth.schema';

export const authRoutes = Router();

authRoutes.post('/auth/login', validar(loginSchema), authController.login);
