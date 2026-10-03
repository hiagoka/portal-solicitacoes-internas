import type { Usuario } from '@/types'
import { ApiError, http } from './httpClient'

export const authService = {
  async login(usuario: string, senha: string): Promise<Usuario> {
    const { usuario: logado } = await http.post<{ usuario: Usuario }>('/auth/login', { usuario, senha })
    return logado
  },

  async logout(): Promise<void> {
    await http.post<void>('/auth/logout')
  },

  // Retorna o usuário da sessão atual, ou null se ninguém estiver logado (não é um erro).
  async usuarioAtual(): Promise<Usuario | null> {
    try {
      const { usuario } = await http.get<{ usuario: Usuario }>('/auth/me')
      return usuario
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 401) return null
      throw erro
    }
  },
}
