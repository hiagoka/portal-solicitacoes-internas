import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';
import { AppError } from './AppError';

// Limita tentativas de login por IP para dificultar adivinhação de senha por força bruta.
export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test', // os testes automatizados não devem ser bloqueados
  handler: (_req, _res, next) => next(new AppError(429, 'Muitas tentativas de login. Tente novamente em alguns minutos.')),
});
