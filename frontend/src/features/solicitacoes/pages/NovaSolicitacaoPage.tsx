import { useNavigate } from 'react-router'
import { ROTAS } from '@/constants'
import { useTituloDaPagina } from '@/hooks'
import { SolicitacaoForm } from '../components/SolicitacaoForm'
import { useCriarSolicitacao } from '../hooks'

export function NovaSolicitacaoPage() {
  const navigate = useNavigate()
  useTituloDaPagina('Nova solicitação')
  const criar = useCriarSolicitacao()

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
      <h1 className="text-xl font-semibold text-text">Nova solicitação</h1>
      <SolicitacaoForm textoEnviar="Criar solicitação" onSubmit={criar} onCancelar={() => navigate(ROTAS.solicitacoes)} />
    </div>
  )
}
