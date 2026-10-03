import { EmptyState, LinkButton } from '@/components/ui'
import { ROTAS } from '@/constants'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi removido."
      action={<LinkButton to={ROTAS.dashboard} variant="secondary">Voltar para o início</LinkButton>}
    />
  )
}
