import type { ReactNode } from 'react'
import { Button, EmptyState, LinkButton, Spinner } from '@/components/ui'
import { ROTAS } from '@/constants'

type EstadoDaBuscaProps = {
  carregando: boolean
  naoEncontrada: boolean
  erro: Error | null
  onTentarNovamente: () => void
  /** Renderizado quando a solicitação foi carregada. */
  children: ReactNode
}

// Os três estados que toda tela de uma solicitação precisa tratar (carregando, não encontrada, erro).
export function EstadoDaBusca({ carregando, naoEncontrada, erro, onTentarNovamente, children }: EstadoDaBuscaProps) {
  if (carregando) {
    return (
      <div className="flex justify-center py-16 text-primary">
        <Spinner size="lg" label="Carregando solicitação" />
      </div>
    )
  }
  if (naoEncontrada) {
    return (
      <EmptyState
        title="Solicitação não encontrada"
        description="Ela não existe ou você não tem acesso a ela."
        action={<LinkButton to={ROTAS.solicitacoes} variant="secondary">Voltar para a lista</LinkButton>}
      />
    )
  }
  if (erro) {
    return (
      <EmptyState
        title="Não foi possível carregar"
        description={erro.message}
        action={<Button variant="secondary" onClick={onTentarNovamente}>Tentar novamente</Button>}
      />
    )
  }
  return <>{children}</>
}
