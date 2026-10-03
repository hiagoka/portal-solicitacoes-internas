import { useConsulta } from '@/hooks'
import { solicitacaoService } from '@/services'
import type { FiltrosSolicitacao } from '@/types'

// Lista de solicitações conforme os filtros. Enquanto uma nova busca roda, a lista anterior continua
// disponível (a tela a mostra esmaecida em vez de piscar).
export function useSolicitacoes(filtros: FiltrosSolicitacao) {
  const { status, categoria, busca, de, ate } = filtros
  const { dados, carregando, erro, recarregar } = useConsulta(
    JSON.stringify([status, categoria, busca, de, ate]),
    () => solicitacaoService.listar({ status, categoria, busca, de, ate }),
    { mensagemErro: 'Não foi possível carregar as solicitações.', manterAnterior: true },
  )

  return { solicitacoes: dados, carregando, erro: erro?.message ?? null, recarregar }
}
