import type { RequestHandler } from 'express';
import type { ZodType } from 'zod';
import { AppError } from './AppError';

type Origem = 'body' | 'query' | 'params';

// Valida body, query ou params com um schema zod.
// O resultado já tipado e tratado fica em res.locals[origem]; os controllers usam esse valor
// (e não req.body direto), garantindo que só dados válidos chegam à regra de negócio.
export const validar = (schema: ZodType, origem: Origem = 'body'): RequestHandler => (req, res, next) => {
  const resultado = schema.safeParse(req[origem]);
  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((i) => ({ campo: i.path.join('.'), mensagem: i.message }));
    return next(AppError.badRequest('Dados inválidos', detalhes));
  }
  res.locals[origem] = resultado.data;
  next();
};
