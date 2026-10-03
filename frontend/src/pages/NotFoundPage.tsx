import { Link } from 'react-router'
import { EmptyState } from '@/components/ui'
import { ROTAS } from '@/constants'

export function NotFoundPage() {
  return (
    <EmptyState
      title="Página não encontrada"
      description="O endereço que você tentou acessar não existe ou foi removido."
      action={
        <Link to={ROTAS.dashboard} className="font-medium text-primary hover:underline">
          Voltar para o início
        </Link>
      }
    />
  )
}
