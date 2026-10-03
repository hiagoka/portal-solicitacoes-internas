import { Button, EmptyState, LinkButton, Spinner } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'
import { DistribuicaoBar } from '../components/DistribuicaoBar'
import { IndicadorCard } from '../components/IndicadorCard'
import { useDashboard } from '../hooks/useDashboard'

export function DashboardPage() {
  const { usuario } = useAuth()
  const { indicadores, carregando, erro, recarregar } = useDashboard()
  const ehAtendente = usuario?.perfil === 'atendente'

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
    if (carregando || !indicadores) {
      return (
        <div className="flex justify-center py-16 text-primary">
          <Spinner size="lg" label="Carregando indicadores" />
        </div>
      )
    }
    return (
      <div className="flex flex-col gap-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <IndicadorCard tipo="total" valor={indicadores.total} />
          <IndicadorCard tipo="aberto" valor={indicadores.abertas} />
          <IndicadorCard tipo="em_atendimento" valor={indicadores.emAtendimento} />
          <IndicadorCard tipo="concluido" valor={indicadores.concluidas} />
        </div>
        <DistribuicaoBar indicadores={indicadores} />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-text">Olá, {usuario?.nome}</h1>
          <p className="text-sm text-textMuted">
            {ehAtendente ? 'Visão geral de todas as solicitações.' : 'Resumo das suas solicitações.'}
          </p>
        </div>
        <LinkButton to={ROTAS.solicitacoes} variant="secondary">Ver solicitações</LinkButton>
      </div>
      {conteudo()}
    </div>
  )
}
