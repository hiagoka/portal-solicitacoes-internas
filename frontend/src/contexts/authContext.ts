import { createContext } from 'react'
import type { Usuario } from '@/types'

export interface AuthContextValue {
  /** Usuário logado, ou null se ninguém estiver logado. */
  usuario: Usuario | null
  /** true enquanto verifica, ao abrir o app, se já existe uma sessão ativa. */
  carregando: boolean
  /** Lança ApiError se as credenciais forem inválidas. */
  login: (usuario: string, senha: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
