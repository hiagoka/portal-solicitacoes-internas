import { Button, Card, EmptyState, LinkButton, Spinner } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'
import { FiltrosBar } from '../components/FiltrosBar'
import { PaginacaoListagem } from '../components/PaginacaoListagem'
import { SolicitacaoTable } from '../components/SolicitacaoTable'
import { useFiltrosSolicitacoes, useSolicitacoes } from '../hooks'

// A página só monta a tela: os dados vêm dos hooks e cada pedaço visual é um componente.
export function ListaSolicitacoesPage() {
  const { usuario } = useAuth()
  const f = useFiltrosSolicitacoes()
  const { solicitacoes, paginacao, carregando, erro, recarregar } = useSolicitacoes(f.aplicados)

  const titulo = usuario?.perfil === 'atendente' ? 'Todas as solicitações' : 'Minhas solicitações'
  const total = paginacao?.total
  const botaoNova = <LinkButton to={ROTAS.novaSolicitacao}>Nova solicitação</LinkButton>

  function conteudo() {
    if (erro) {
      return (
        <EmptyState
          title="Não foi possível carregar"
          description={erro}
          action={<Button variant="secondary" onClick={recarregar}>Tentar novamente</Button>}
        />
      )
    }
    if (solicitacoes === null || paginacao === null) {
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Carregando solicitações" />
        </div>
      )
    }
    if (solicitacoes.length === 0 && paginacao.total > 0) {
      // A página pedida não existe mais (ex.: o último item dela foi excluído por outra pessoa).
      return (
        <EmptyState
          title="Esta página não existe mais"
          description="O número de solicitações mudou desde que você abriu a lista."
          action={<Button variant="secondary" onClick={() => f.irParaPagina(paginacao.totalPaginas)}>Ir para a última página</Button>}
        />
      )
    }
    if (solicitacoes.length === 0) {
      return f.temFiltros ? (
        <EmptyState
          title="Nenhuma solicitação encontrada"
          description="Nenhum resultado para os filtros escolhidos."
          action={<Button variant="secondary" onClick={f.limpar}>Limpar filtros</Button>}
        />
      ) : (
        <EmptyState
          title="Nenhuma solicitação ainda"
          description="Quando houver solicitações, elas aparecerão aqui."
          action={botaoNova}
        />
      )
    }
    return <SolicitacaoTable solicitacoes={solicitacoes} />
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">{titulo}</h1>
          <p className="text-sm text-textMuted" aria-live="polite">
            {total === undefined ? ' ' : `${total} ${total === 1 ? 'solicitação' : 'solicitações'}`}
          </p>
        </div>
        {botaoNova}
      </div>

      <FiltrosBar filtros={f.filtros} erroPeriodo={f.erroPeriodo} temFiltros={f.temFiltros} onChange={f.alterar} onLimpar={f.limpar} />

      {/* Durante uma nova busca, a página anterior fica visível e esmaecida (sem piscar). */}
      <Card padding="none" aria-busy={carregando} className={carregando && solicitacoes ? 'opacity-60 transition-opacity' : undefined}>
        {conteudo()}
        {paginacao && paginacao.total > 0 && !erro && (
          <PaginacaoListagem paginacao={paginacao} carregando={carregando} onPagina={f.irParaPagina} onPorPagina={f.alterarPorPagina} />
        )}
      </Card>
    </div>
  )
}
