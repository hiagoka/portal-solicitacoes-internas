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
