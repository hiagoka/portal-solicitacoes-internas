import { useLocation } from 'react-router'
import { destinoAposLogin, type EstadoDeOrigem } from '../utils/destinoAposLogin'

// Para onde ir depois de entrar: a página que o usuário tentou abrir antes de ser mandado ao login (guardada pelo
// ProtectedRoute, com filtros e página) ou, na falta dela, o dashboard.
// Fica num hook compartilhado porque o LoginPage e o formulário precisam concordar: se cada um
// calculasse o destino, o redirecionamento do LoginPage "ganharia" a corrida e ignoraria a página pedida.
export function useDestinoPosLogin(): string {
  const location = useLocation()
  return destinoAposLogin(location.state as EstadoDeOrigem)
}
