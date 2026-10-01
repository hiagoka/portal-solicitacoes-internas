import { query } from '../config/database';
import type { UsuarioRow } from '../types/usuario';

export const usuarioRepository = {
  async buscarPorUsuario(usuario: string): Promise<UsuarioRow | null> {
    const { rows } = await query<UsuarioRow>('SELECT * FROM usuarios WHERE usuario = $1', [usuario]);
    return rows[0] ?? null;
  },

  async buscarPorId(id: number): Promise<UsuarioRow | null> {
    const { rows } = await query<UsuarioRow>('SELECT * FROM usuarios WHERE id = $1', [id]);
    return rows[0] ?? null;
  },
};
