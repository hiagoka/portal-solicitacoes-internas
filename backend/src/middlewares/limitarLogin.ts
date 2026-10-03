import { rateLimit } from 'express-rate-limit';
import { env } from '../config/env';
import { AppError } from './AppError';

// Limita tentativas de login FALHAS por IP para dificultar adivinhação de senha por força bruta.
// Logins bem-sucedidos não contam: num escritório vários colaboradores saem do mesmo IP, e entrar
// normalmente não pode esgotar o limite de todos.
export const limitarLogin = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === 'test', // os testes automatizados não devem ser bloqueados
  handler: (_req, _res, next) => next(new AppError(429, 'Muitas tentativas de login. Tente novamente em alguns minutos.')),
});
