import { useConsulta } from '@/hooks'
import { ApiError, solicitacaoService } from '@/services'

// Uma solicitação pelo código. `substituir` troca o dado em memória (ex.: depois de mudar o status).
export function useSolicitacao(id: number) {
  const { dados, carregando, erro, recarregar, substituir } = useConsulta(
    String(id),
    () => solicitacaoService.obter(id),
    { mensagemErro: 'Não foi possível carregar a solicitação.' },
  )

  return {
    solicitacao: dados,
    carregando,
    erro,
    naoEncontrada: erro instanceof ApiError && erro.status === 404,
    recarregar,
    substituir,
  }
}
