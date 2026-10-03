import { useLocation } from 'react-router'
import { ROTAS } from '@/constants'

type EstadoDeOrigem = { from?: { pathname: string } } | null

// Para onde ir depois de entrar: a página que o usuário tentou abrir antes de ser mandado ao login
// (guardada pelo ProtectedRoute) ou, na falta dela, o dashboard.
// Fica num hook compartilhado porque o LoginPage e o formulário precisam concordar: se cada um
// calculasse o destino, o redirecionamento do LoginPage "ganharia" a corrida e ignoraria a página pedida.
export function useDestinoPosLogin(): string {
  const location = useLocation()
  return (location.state as EstadoDeOrigem)?.from?.pathname ?? ROTAS.dashboard
}
