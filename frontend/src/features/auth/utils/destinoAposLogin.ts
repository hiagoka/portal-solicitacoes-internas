import { ROTAS } from '@/constants'

// O que o ProtectedRoute guarda no estado da navegação: a página que o usuário tentou abrir antes de ser mandado ao login.
export type EstadoDeOrigem = { from?: { pathname: string; search?: string; hash?: string } } | null | undefined

// Para onde ir depois de entrar: a página pedida com TUDO o que ela tinha (caminho, filtros e página na query string,
// fragmento). Antes só o caminho era mantido, e o link /solicitacoes?status=aberto&pagina=2 virava /solicitacoes.
// Só aceita caminhos internos: nunca deve ser possível mandar o usuário a outro site por este estado.
export function destinoAposLogin(estado: EstadoDeOrigem): string {
  const origem = estado?.from
  if (!origem) return ROTAS.dashboard
  const { pathname, search = '', hash = '' } = origem
  const interno = pathname.startsWith('/') && !pathname.startsWith('//')
  if (!interno || pathname === ROTAS.login) return ROTAS.dashboard // fora do site, ou de volta ao login (laço)
  return `${pathname}${search}${hash}`
}
