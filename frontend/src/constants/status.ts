import type { Status } from '@/types'

export const STATUS_LISTA: readonly Status[] = ['aberto', 'em_atendimento', 'concluido']

export const STATUS_LABEL: Record<Status, string> = {
  aberto: 'Aberto',
  em_atendimento: 'Em Atendimento',
  concluido: 'Concluído',
}

// Classes escritas por extenso (e não montadas com template string) para o Tailwind conseguir detectá-las.
export const STATUS_CLASSES: Record<Status, { texto: string; fundo: string; barra: string }> = {
  aberto: { texto: 'text-status-aberto', fundo: 'bg-status-aberto/10', barra: 'bg-status-aberto' },
  em_atendimento: { texto: 'text-status-emAtendimento', fundo: 'bg-status-emAtendimento/10', barra: 'bg-status-emAtendimento' },
  concluido: { texto: 'text-status-concluido', fundo: 'bg-status-concluido/10', barra: 'bg-status-concluido' },
}

// Espelha as transições aceitas pela API, só para mostrar ao atendente opções válidas.
// A API continua sendo a autoridade: se divergir, ela responde 409.
export const STATUS_TRANSICOES: Record<Status, readonly Status[]> = {
  aberto: ['em_atendimento', 'concluido'],
  em_atendimento: ['aberto', 'concluido'],
  concluido: ['em_atendimento'],
}
