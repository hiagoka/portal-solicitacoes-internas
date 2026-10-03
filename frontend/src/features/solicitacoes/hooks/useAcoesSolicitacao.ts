import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ROTAS, STATUS_LABEL } from '@/constants'
import { useToast } from '@/hooks'
import { ApiError, solicitacaoService } from '@/services'
import { formatarCodigo } from '@/lib/formatar'
import type { Solicitacao, SolicitacaoInput, Status } from '@/types'

const mensagemDe = (e: unknown, padrao: string) => (e instanceof ApiError ? e.message : padrao)

// Criar: ao concluir, vai para a tela de detalhes da nova solicitação.
export function useCriarSolicitacao() {
  const navigate = useNavigate()
  const toast = useToast()

  return async (dados: SolicitacaoInput) => {
    const criada = await solicitacaoService.criar(dados)
    toast.sucesso(`Solicitação ${formatarCodigo(criada.id)} criada.`)
    navigate(ROTAS.detalhesSolicitacao(criada.id))
  }
}

// Editar: ao concluir, volta para os detalhes.
export function useEditarSolicitacao(id: number) {
  const navigate = useNavigate()
  const toast = useToast()

  return async (dados: SolicitacaoInput) => {
    await solicitacaoService.editar(id, dados)
    toast.sucesso('Solicitação atualizada.')
    navigate(ROTAS.detalhesSolicitacao(id))
  }
}

// Ações da tela de detalhes (excluir e mudar status). Em caso de erro recarrega a solicitação, porque
// o motivo costuma ser que ela mudou desde que a tela abriu (ex.: o atendente já a assumiu).
export function useAcoesDetalhes(
  solicitacao: Solicitacao,
  aoAtualizar: (nova: Solicitacao) => void,
  recarregar: () => void,
) {
  const navigate = useNavigate()
  const toast = useToast()
  const [excluindo, setExcluindo] = useState(false)
  const [alterandoStatus, setAlterandoStatus] = useState(false)

  /** `fecharModal` roda ANTES do toast de erro: o <dialog> ficaria por cima da notificação. */
  async function excluir(fecharModal: () => void) {
    setExcluindo(true)
    try {
      await solicitacaoService.excluir(solicitacao.id)
      toast.sucesso(`Solicitação ${formatarCodigo(solicitacao.id)} excluída.`)
      navigate(ROTAS.solicitacoes)
    } catch (e) {
      fecharModal()
      toast.erro(mensagemDe(e, 'Não foi possível excluir a solicitação.'))
      recarregar()
      setExcluindo(false)
    }
  }

  async function mudarStatus(novo: Status) {
    setAlterandoStatus(true)
    try {
      aoAtualizar(await solicitacaoService.alterarStatus(solicitacao.id, novo))
      toast.sucesso(`Status alterado para "${STATUS_LABEL[novo]}".`)
    } catch (e) {
      toast.erro(mensagemDe(e, 'Não foi possível alterar o status.'))
      recarregar()
    } finally {
      setAlterandoStatus(false)
    }
  }

  return { excluindo, alterandoStatus, excluir, mudarStatus }
}
