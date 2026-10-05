import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError } from './AppError';
import { env } from '../config/env';

// Mensagens em português para os erros de cliente mais comuns do leitor de corpo.
const MENSAGENS_DE_CLIENTE: Record<number, string> = {
  413: 'O conteúdo enviado é grande demais',
  415: 'Tipo de conteúdo não suportado',
};

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

  // Outros erros do leitor de corpo (body-parser) são do CLIENTE e trazem o próprio código HTTP:
  // 413 (corpo grande demais), 415 (codificação não suportada) etc. Respondem com esse código, e não com 500.
  const status = (err as { status?: unknown }).status;
  if (typeof status === 'number' && status >= 400 && status < 500) {
    res.status(status).json({ erro: MENSAGENS_DE_CLIENTE[status] ?? 'Requisição inválida' });
    return;
  }

  // Erro inesperado: registra no servidor e não vaza detalhes internos ao cliente.
  if (env.NODE_ENV !== 'test') console.error(err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
};
