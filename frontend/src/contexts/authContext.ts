import { createContext } from 'react'
import type { Usuario } from '@/types'

export interface AuthContextValue {
  /** Usuário logado, ou null se ninguém estiver logado. */
  usuario: Usuario | null
  /** true se o usuário clicou em "Sair" (e não se a sessão expirou). Decide se o login volta à página anterior. */
  saiuVoluntariamente: boolean
  /** true enquanto verifica, ao abrir o app, se já existe uma sessão ativa. */
  carregando: boolean
  /** Lança ApiError se as credenciais forem inválidas. */
  login: (usuario: string, senha: string) => Promise<void>
  /** Lança erro se o servidor não confirmar o encerramento da sessão (o usuário continua logado). */
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
