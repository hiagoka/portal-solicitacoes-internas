export const CATEGORIAS = ['TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura'] as const;
export const STATUS = ['aberto', 'em_atendimento', 'concluido'] as const;

export type Categoria = (typeof CATEGORIAS)[number];
export type Status = (typeof STATUS)[number];

// Solicitação como a API devolve ao cliente.
export interface Solicitacao {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Categoria;
  status: Status;
  criadoEm: Date;
  atualizadoEm: Date;
  solicitante: { id: number; nome: string };
}

// Mudanças de status permitidas. Qualquer outra (ex.: concluido -> aberto) é recusada.
export const TRANSICOES: Record<Status, readonly Status[]> = {
  aberto: ['em_atendimento', 'concluido'],
  em_atendimento: ['aberto', 'concluido'],
  concluido: ['em_atendimento'], // reabrir para atendimento
};

// Informações de paginação devolvidas junto com a lista.
export interface Paginacao {
  pagina: number;
  porPagina: number;
  /** Total de solicitações que atendem aos filtros (em todas as páginas). */
  total: number;
  totalPaginas: number;
}

// Um registro do histórico de status. `statusAnterior` é nulo no evento de abertura.
export interface EventoHistorico {
  id: number;
  statusAnterior: Status | null;
  statusNovo: Status;
  criadoEm: Date;
  usuario: { id: number; nome: string };
}
