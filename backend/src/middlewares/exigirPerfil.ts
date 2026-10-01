import type { RequestHandler } from 'express';
import type { Perfil } from '../types/usuario';
import { AppError } from './AppError';

// Restringe a rota a determinados perfis. Deve vir depois do `autenticar`.
export const exigirPerfil = (...perfis: Perfil[]): RequestHandler => (req, _res, next) => {
  if (!req.usuario) throw AppError.unauthorized();
  if (!perfis.includes(req.usuario.perfil)) throw AppError.forbidden('Seu perfil não tem permissão para esta ação');
  next();
};
