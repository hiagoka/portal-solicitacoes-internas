import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { ApiError, authService, definirAoExpirarSessao } from '@/services'
import type { Usuario } from '@/types'
import { AuthContext, type AuthContextValue } from './authContext'

// Guarda quem está logado. A sessão em si vive no cookie httpOnly; aqui só ficam os dados do usuário.
export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [saiuVoluntariamente, setSaiuVoluntariamente] = useState(false)

  // Ao abrir o app (ou recarregar a página), descobre se o cookie ainda representa uma sessão válida.
  useEffect(() => {
    let cancelado = false
    authService
      .usuarioAtual()
      .then((atual) => !cancelado && setUsuario(atual))
      .catch(() => !cancelado && setUsuario(null)) // API fora do ar: cai na tela de login
      .finally(() => !cancelado && setCarregando(false))
    return () => {
      cancelado = true
    }
  }, [])

  // Sessão expirada no meio do uso: qualquer 401 em rota protegida derruba o usuário para o login.
  useEffect(() => {
    definirAoExpirarSessao(() => setUsuario(null))
    return () => definirAoExpirarSessao(null)
  }, [])

  const login = useCallback(async (nome: string, senha: string) => {
    setUsuario(await authService.login(nome, senha))
    setSaiuVoluntariamente(false)
  }, [])

  // Só mostra o usuário como "saído" depois que o servidor confirma. Se a chamada falhar (API fora do ar, por
  // exemplo), o cookie de sessão continua válido: fingir que saiu deixaria a sessão aberta num computador
  // compartilhado, e um recarregamento da página logaria a pessoa de volta. Por isso o erro é repassado.
  const logout = useCallback(async () => {
    try {
      await authService.logout()
    } catch (erro) {
      // 401 = a sessão já tinha expirado; "sair" já está feito, não há o que desfazer.
      if (!(erro instanceof ApiError && erro.status === 401)) throw erro
    }
    setSaiuVoluntariamente(true)
    setUsuario(null)
  }, [])

  const valor = useMemo<AuthContextValue>(
    () => ({ usuario, carregando, saiuVoluntariamente, login, logout }),
    [usuario, carregando, saiuVoluntariamente, login, logout],
  )

  return <AuthContext.Provider value={valor}>{children}</AuthContext.Provider>
}
