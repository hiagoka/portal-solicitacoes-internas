import { useState } from 'react'
import { Button, LinkButton } from '@/components/ui'
import { ROTAS } from '@/constants'
import { useAuth } from '@/hooks'
import type { Solicitacao } from '@/types'
import { useAcoesDetalhes } from '../hooks'
import { podeEditarOuExcluir, podeMudarStatus } from '../utils/permissoes'
import { DetalhesCard } from './DetalhesCard'
import { ExcluirModal } from './ExcluirModal'
import { HistoricoCard } from './HistoricoCard'
import { StatusSelect } from './StatusSelect'

type DetalhesConteudoProps = {
  solicitacao: Solicitacao
  aoAtualizar: (nova: Solicitacao) => void
  recarregar: () => void
}

export function DetalhesConteudo({ solicitacao, aoAtualizar, recarregar }: DetalhesConteudoProps) {
  const { usuario } = useAuth()
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false)
  const { excluindo, alterandoStatus, excluir, mudarStatus } = useAcoesDetalhes(solicitacao, aoAtualizar, recarregar)

  const editavel = podeEditarOuExcluir(usuario, solicitacao)

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="min-w-0 break-words text-xl font-semibold text-text">{solicitacao.titulo}</h1>
        {editavel && (
          <div className="flex gap-2">
            <LinkButton to={ROTAS.editarSolicitacao(solicitacao.id)} variant="secondary">
              Editar
            </LinkButton>
            <Button variant="danger" onClick={() => setConfirmandoExclusao(true)}>
              Excluir
            </Button>
          </div>
        )}
      </div>

      <DetalhesCard solicitacao={solicitacao} />
      <HistoricoCard solicitacaoId={solicitacao.id} atualizadoEm={solicitacao.atualizadoEm} />

      {podeMudarStatus(usuario, solicitacao) && (
        <StatusSelect statusAtual={solicitacao.status} alterando={alterandoStatus} onAlterar={mudarStatus} />
      )}

      {/* Só existe no HTML para quem pode excluir; os demais nem recebem o diálogo. */}
      {editavel && (
        <ExcluirModal
          open={confirmandoExclusao}
          codigo={solicitacao.id}
          titulo={solicitacao.titulo}
          excluindo={excluindo}
          onConfirmar={() => void excluir(() => setConfirmandoExclusao(false))}
          onCancelar={() => setConfirmandoExclusao(false)}
        />
      )}
    </div>
  )
}
