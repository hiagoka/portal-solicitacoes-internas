import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { AppError } from '../middlewares/AppError';
import { usuarioRepository } from '../repositories/usuarioRepository';
import type { UsuarioPublico, UsuarioRow } from '../types/usuario';

// Hash de uma senha qualquer. Usado quando o usuário não existe, para que o tempo de resposta
// seja parecido com o de uma senha errada e ninguém descubra quais logins existem.
const HASH_FALSO = bcrypt.hashSync('senha-inexistente', 10);

export function paraPublico(u: UsuarioRow): UsuarioPublico {
  return { id: u.id, nome: u.nome, usuario: u.usuario, perfil: u.perfil };
}

export const authService = {
  async login(usuario: string, senha: string) {
    const encontrado = await usuarioRepository.buscarPorUsuario(usuario);
    const senhaConfere = await bcrypt.compare(senha, encontrado?.senha_hash ?? HASH_FALSO);

    // Mesma mensagem para "usuário não existe" e "senha errada".
    if (!encontrado || !senhaConfere) throw AppError.unauthorized('Usuário ou senha inválidos');

    const token = jwt.sign({ perfil: encontrado.perfil }, env.JWT_SECRET, {
      subject: String(encontrado.id),
      expiresIn: env.JWT_EXPIRES_IN as SignOptions['expiresIn'],
    });
    return { token, usuario: paraPublico(encontrado) };
  },

  // Devolve o id do usuário dentro do token, ou lança 401 se o token for inválido/expirado.
  verificarToken(token: string): number {
    try {
      const payload = jwt.verify(token, env.JWT_SECRET);
      const id = Number(typeof payload === 'object' ? payload.sub : NaN);
      if (!Number.isInteger(id)) throw new Error('sub inválido');
      return id;
    } catch {
      throw AppError.unauthorized('Sessão inválida ou expirada');
    }
  },
};
