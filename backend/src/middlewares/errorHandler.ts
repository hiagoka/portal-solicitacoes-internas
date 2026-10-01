import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './AppError';
import { env } from '../config/env';

export const naoEncontrado: RequestHandler = (_req, _res, next) => {
  next(AppError.notFound('Rota não encontrada'));
};

// Middleware global: toda falha da API passa por aqui e sai no mesmo formato JSON.
export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.status).json({ erro: err.message, detalhes: err.detalhes });
    return;
  }

  // JSON malformado no corpo da requisição
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({ erro: 'JSON inválido' });
    return;
  }

  // Erro inesperado: registra no servidor e não vaza detalhes internos ao cliente.
  if (env.NODE_ENV !== 'test') console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
};
