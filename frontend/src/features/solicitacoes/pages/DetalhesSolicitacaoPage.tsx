import { Link } from 'react-router'
import { ROTAS } from '@/constants'
import { useTituloDaPagina } from '@/hooks'
import { formatarCodigo } from '@/lib/formatar'
import { DetalhesConteudo } from '../components/DetalhesConteudo'
import { EstadoDaBusca } from '../components/EstadoDaBusca'
import { useIdDaRota, useSolicitacao } from '../hooks'

export function DetalhesSolicitacaoPage() {
  const id = useIdDaRota()
  const { solicitacao, carregando, erro, naoEncontrada, recarregar, substituir } = useSolicitacao(id)
  useTituloDaPagina(solicitacao ? `Solicitação ${formatarCodigo(solicitacao.id)}` : 'Solicitação')

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Link to={ROTAS.solicitacoes} className="text-sm text-textMuted hover:text-text">
        ← Voltar para a lista
      </Link>
      <EstadoDaBusca
        carregando={carregando}
        naoEncontrada={naoEncontrada || Number.isNaN(id)}
        erro={erro}
        onTentarNovamente={recarregar}
      >
        {solicitacao && <DetalhesConteudo solicitacao={solicitacao} aoAtualizar={substituir} recarregar={recarregar} />}
      </EstadoDaBusca>
    </div>
  )
}
