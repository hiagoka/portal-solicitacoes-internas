import { cn } from '@/lib/cn'

// Visual compartilhado por Input, Select e Textarea, para os três ficarem idênticos.
export function campoClasses(temErro: boolean, extra?: string) {
  return cn(
    'w-full rounded-md border bg-surface px-3 text-text transition-colors placeholder:text-textMuted',
    'focus:outline-2 focus:outline-offset-0 focus:outline-primary',
    'disabled:cursor-not-allowed disabled:opacity-60',
    temErro ? 'border-danger' : 'border-border',
    extra,
  )
}

// Liga o campo ao texto de erro/dica para leitores de tela.
export function descricaoDoCampo(id: string, erro?: string, dica?: string) {
  if (erro) return `${id}-erro`
  if (dica) return `${id}-dica`
  return undefined
}
