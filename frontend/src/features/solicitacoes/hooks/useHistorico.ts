import { useConsulta } from '@/hooks'
import { solicitacaoService } from '@/services'

// Linha do tempo de status de uma solicitação. A chave inclui `atualizadoEm`: quando a solicitação muda (por exemplo,
// o atendente troca o status), a data de atualização muda e o histórico é buscado de novo sozinho, sem recarregar a página.
export function useHistorico(id: number, atualizadoEm: string) {
  const { dados, carregando, erro, recarregar } = useConsulta(`${id}:${atualizadoEm}`, () => solicitacaoService.historico(id), {
    mensagemErro: 'Não foi possível carregar o histórico.',
    manterAnterior: true, // enquanto recarrega, a lista anterior continua visível (sem piscar)
  })
  return { eventos: dados, carregando, erro: erro?.message ?? null, recarregar }
}
