import type { FiltrosSolicitacao, ListaPaginada, Solicitacao, SolicitacaoInput, Status } from '@/types'
import { http } from './httpClient'

const BASE = '/solicitacoes'

export const solicitacaoService = {
  listar(filtros: FiltrosSolicitacao = {}): Promise<ListaPaginada> {
    return http.get<ListaPaginada>(BASE, { ...filtros })
  },

  async obter(id: number): Promise<Solicitacao> {
    const { solicitacao } = await http.get<{ solicitacao: Solicitacao }>(`${BASE}/${id}`)
    return solicitacao
  },

  async criar(dados: SolicitacaoInput): Promise<Solicitacao> {
    const { solicitacao } = await http.post<{ solicitacao: Solicitacao }>(BASE, dados)
    return solicitacao
  },

  async editar(id: number, dados: SolicitacaoInput): Promise<Solicitacao> {
    const { solicitacao } = await http.put<{ solicitacao: Solicitacao }>(`${BASE}/${id}`, dados)
    return solicitacao
  },

  async excluir(id: number): Promise<void> {
    await http.delete<void>(`${BASE}/${id}`)
  },

  async alterarStatus(id: number, status: Status): Promise<Solicitacao> {
    const { solicitacao } = await http.patch<{ solicitacao: Solicitacao }>(`${BASE}/${id}/status`, { status })
    return solicitacao
  },
}
