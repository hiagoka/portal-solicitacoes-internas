import type { RequestHandler } from 'express';
import { NOME_COOKIE } from '../controllers/authController';
import { usuarioRepository } from '../repositories/usuarioRepository';
import { authService, paraPublico } from '../services/authService';
import type { UsuarioPublico } from '../types/usuario';
import { AppError } from './AppError';

declare global {
  namespace Express {
    interface Request {
      usuario?: UsuarioPublico; // preenchido pelo middleware `autenticar`
    }
  }
}

// Exige login: lê o cookie, valida o JWT e anexa o usuário à requisição.
// Consulta o banco para garantir que o usuário ainda existe (token antigo de usuário removido não vale).
export const autenticar: RequestHandler = async (req, _res, next) => {
  const token = req.cookies?.[NOME_COOKIE];
  if (!token) throw AppError.unauthorized();

  const id = authService.verificarToken(token);
  const usuario = await usuarioRepository.buscarPorId(id);
  if (!usuario) throw AppError.unauthorized('Sessão inválida ou expirada');

  req.usuario = paraPublico(usuario);
  next();
};
