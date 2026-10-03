import { useConsulta } from '@/hooks'
import { solicitacaoService } from '@/services'
import type { FiltrosSolicitacao } from '@/types'

// Uma página da lista de solicitações, conforme filtros e paginação. Enquanto uma nova busca roda, a página
// anterior continua disponível (a tela a mostra esmaecida em vez de piscar).
export function useSolicitacoes(filtros: FiltrosSolicitacao) {
  const { status, categoria, busca, de, ate, pagina, porPagina } = filtros
  const { dados, carregando, erro, recarregar } = useConsulta(
    JSON.stringify([status, categoria, busca, de, ate, pagina, porPagina]),
    () => solicitacaoService.listar({ status, categoria, busca, de, ate, pagina, porPagina }),
    { mensagemErro: 'Não foi possível carregar as solicitações.', manterAnterior: true },
  )

  return {
    solicitacoes: dados?.solicitacoes ?? null,
    paginacao: dados?.paginacao ?? null,
    carregando,
    erro: erro?.message ?? null,
    recarregar,
  }
}
