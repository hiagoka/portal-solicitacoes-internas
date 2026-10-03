import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type EmptyStateProps = {
  title: string
  description?: string
  /** Ação sugerida, normalmente um Button (ex.: "Nova solicitação"). */
  action?: ReactNode
  className?: string
}

// Mensagem para listas sem resultado ou telas sem dados.
export function EmptyState({ title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-2 px-4 py-12 text-center', className)}>
      <h3 className="text-base font-semibold text-text">{title}</h3>
      {description && <p className="max-w-sm text-sm text-textMuted">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  )
}
