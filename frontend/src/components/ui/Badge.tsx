import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type BadgeProps = {
  /** `custom`: nenhuma cor padrão; quem usa define as cores em `className` (ex.: StatusBadge). */
  tone?: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'custom'
  className?: string
  children: ReactNode
}

const TONS = {
  neutral: 'bg-secondary/10 text-secondary',
  primary: 'bg-primary/10 text-primary',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
  danger: 'bg-danger/10 text-danger',
  custom: '',
} as const

// Etiqueta pequena para status, categorias e contadores.
export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium',
        TONS[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
