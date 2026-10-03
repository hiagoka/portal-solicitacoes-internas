import { useContext } from 'react'
import { AuthContext } from '@/contexts/authContext'

// Uso: const { usuario, login, logout } = useAuth()
export function useAuth() {
  const contexto = useContext(AuthContext)
  if (!contexto) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return contexto
}
