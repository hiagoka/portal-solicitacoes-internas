export type Status = 'aberto' | 'em_atendimento' | 'concluido'
export type Categoria = 'TI' | 'RH' | 'Compras' | 'Financeiro' | 'Infraestrutura'

// Como a API devolve uma solicitação. As datas chegam como texto ISO 8601.
export interface Solicitacao {
  id: number
  titulo: string
  descricao: string
  categoria: Categoria
  status: Status
  criadoEm: string
  atualizadoEm: string
  solicitante: { id: number; nome: string }
}

// Dados enviados ao criar/editar. Status, data e solicitante são definidos pelo servidor.
export interface SolicitacaoInput {
  titulo: string
  descricao: string
  categoria: Categoria
}

// Filtros da listagem. Campo ausente ou vazio = "não filtrar".
export interface FiltrosSolicitacao {
  status?: Status | ''
  categoria?: Categoria | ''
  busca?: string
  de?: string // AAAA-MM-DD
  ate?: string // AAAA-MM-DD
  pagina?: number
  porPagina?: number
}

// Um registro do histórico de status. `statusAnterior` é nulo no evento de abertura.
export interface EventoHistorico {
  id: number
  statusAnterior: Status | null
  statusNovo: Status
  criadoEm: string
  usuario: { id: number; nome: string }
}

// Dados de navegação entre páginas, devolvidos junto com a lista.
export interface Paginacao {
  pagina: number
  porPagina: number
  /** Total de solicitações que atendem aos filtros (em todas as páginas). */
  total: number
  totalPaginas: number
}

export interface ListaPaginada {
  solicitacoes: Solicitacao[]
  paginacao: Paginacao
}
