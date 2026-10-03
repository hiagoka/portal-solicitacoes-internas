import { EmptyState, LinkButton } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useTituloDaPagina } from '@/hooks'

export function NotFoundPage() {
  useTituloDaPagina('Página não encontrada')
  return (
    <EmptyState
      titleAs="h1"
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi removido."
      action={<LinkButton to={ROTAS.dashboard} variant="secondary">Voltar para o início</LinkButton>}
    />
  )
}
