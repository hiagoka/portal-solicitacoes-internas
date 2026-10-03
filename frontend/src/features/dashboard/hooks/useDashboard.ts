import { useConsulta } from '@/hooks'
import { dashboardService } from '@/services'

export function useDashboard() {
  const { dados, carregando, erro, recarregar } = useConsulta('dashboard', dashboardService.indicadores, {
    mensagemErro: 'Não foi possível carregar os indicadores.',
  })

  return { indicadores: dados, carregando, erro: erro?.message ?? null, recarregar }
}
