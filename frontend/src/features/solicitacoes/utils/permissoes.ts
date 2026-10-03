import { STATUS_TRANSICOES } from '@/constants'
import type { Solicitacao, Usuario } from '@/types'

// Regras para decidir o que MOSTRAR na tela. A API repete e impõe todas elas: se alguém forçar
// uma chamada, ela responde 403/404/409. Aqui só evitamos oferecer botões que não funcionariam.

/** Só o autor edita ou exclui, e apenas enquanto a solicitação está aberta. */
export function podeEditarOuExcluir(usuario: Usuario | null, solicitacao: Solicitacao): boolean {
  return !!usuario && usuario.id === solicitacao.solicitante.id && solicitacao.status === 'aberto'
}

/** Só o atendente muda o status, e apenas se houver alguma transição possível. */
export function podeMudarStatus(usuario: Usuario | null, solicitacao: Solicitacao): boolean {
  return usuario?.perfil === 'atendente' && STATUS_TRANSICOES[solicitacao.status].length > 0
}
