import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type EmptyStateProps = {
  title: string
  /** Nível do título. `h2` por padrão (a página já tem um `h1`); use `h1` quando o estado ocupa a página inteira. */
  titleAs?: 'h1' | 'h2' | 'h3'
  description?: string
  /** Ação sugerida, normalmente um Button (ex.: "Nova solicitação"). */
  action?: ReactNode
  className?: string
}

// Mensagem para listas sem resultado ou telas sem dados.
export function EmptyState({ title, titleAs: Titulo = 'h2', description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-12 text-center', className)}>
      <Titulo className="text-base font-semibold text-text">{title}</Titulo>
      {description && <p className="max-w-sm text-sm text-textMuted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
