// Caminhos da aplicação. Nenhum componente escreve URL "na mão": usa estes helpers.
export const ROTAS = {
  login: '/login',
  dashboard: '/',
  solicitacoes: '/solicitacoes',
  novaSolicitacao: '/solicitacoes/nova',
  detalhesSolicitacao: (id: number | string) => `/solicitacoes/${id}`,
  editarSolicitacao: (id: number | string) => `/solicitacoes/${id}/editar`,
} as const

// Padrões com parâmetro, usados apenas na definição das rotas do React Router.
export const PADROES_ROTA = {
  detalhesSolicitacao: '/solicitacoes/:id',
  editarSolicitacao: '/solicitacoes/:id/editar',
} as const
