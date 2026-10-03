import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'

// Só deixa passar quem está logado. Quem não está vai para o login, guardando de onde veio
// para voltar para lá depois de entrar.
export function ProtectedRoute() {
  const { usuario, carregando } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-primary">
        <Spinner size="lg" label="Verificando sessão" />
      </div>
    )
  }

  if (!usuario) return <Navigate to={ROTAS.login} replace state={{ from: location }} />

  return <Outlet />
}
