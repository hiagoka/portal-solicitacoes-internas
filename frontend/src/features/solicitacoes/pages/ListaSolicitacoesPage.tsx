import { Link } from 'react-router'
import { Button, Card, EmptyState, Spinner } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'
import { FiltrosBar } from '../components/FiltrosBar'
import { SolicitacaoTable } from '../components/SolicitacaoTable'
import { useFiltrosSolicitacoes, useSolicitacoes } from '../hooks'

// A página só monta a tela: os dados vêm dos hooks e cada pedaço visual é um componente.
export function ListaSolicitacoesPage() {
  const { usuario } = useAuth()
  const { filtros, aplicados, erroPeriodo, temFiltros, alterar, limpar } = useFiltrosSolicitacoes()
  const { solicitacoes, carregando, erro, recarregar } = useSolicitacoes(aplicados)

  const titulo = usuario?.perfil === 'atendente' ? 'Todas as solicitações' : 'Minhas solicitações'
  const botaoNova = (
    <Link to={ROTAS.novaSolicitacao}>
      <Button>Nova solicitação</Button>
    </Link>
  )

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
    if (solicitacoes === null) {
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Carregando solicitações" />
        </div>
      )
    }
    if (solicitacoes.length === 0) {
      return temFiltros ? (
        <EmptyState
          title="Nenhuma solicitação encontrada"
          description="Nenhum resultado para os filtros escolhidos."
          action={<Button variant="secondary" onClick={limpar}>Limpar filtros</Button>}
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
            {solicitacoes ? `${solicitacoes.length} ${solicitacoes.length === 1 ? 'solicitação' : 'solicitações'}` : ' '}
          </p>
        </div>
        {botaoNova}
      </div>

      <FiltrosBar filtros={filtros} erroPeriodo={erroPeriodo} temFiltros={temFiltros} onChange={alterar} onLimpar={limpar} />

      {/* Durante uma nova busca, a lista anterior fica visível e esmaecida (sem piscar). */}
      <Card padding="none" aria-busy={carregando} className={carregando && solicitacoes ? 'opacity-60 transition-opacity' : undefined}>
        {conteudo()}
      </Card>
    </div>
  )
}
