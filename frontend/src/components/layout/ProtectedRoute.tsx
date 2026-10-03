import { Navigate, Outlet, useLocation } from 'react-router'
import { Spinner } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'

// Só deixa passar quem está logado. Quem não está vai para o login, guardando de onde veio para voltar
// para lá depois de entrar. Isso vale para um link aberto sem login ou uma sessão que expirou; depois de um
// "Sair" voluntário não guarda nada, para o próximo usuário não herdar a tela de quem saiu.
export function ProtectedRoute() {
  const { usuario, carregando, saiuVoluntariamente } = useAuth()
  const location = useLocation()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center text-primary">
        <Spinner size="lg" label="Verificando sessão" />
      </div>
    )
  }

  if (!usuario) return <Navigate to={ROTAS.login} replace state={saiuVoluntariamente ? undefined : { from: location }} />

  return <Outlet />
}
