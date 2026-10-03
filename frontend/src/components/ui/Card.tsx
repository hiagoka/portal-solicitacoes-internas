import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'

type CardProps = ComponentPropsWithoutRef<'div'> & {
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

const ESPACAMENTOS = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
} as const

// Bloco de conteúdo sobre o fundo da página. `padding="none"` serve para tabelas que vão até a borda.
export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn('rounded-lg border border-border bg-surface shadow-sm', ESPACAMENTOS[padding], className)}
      {...props}
    >
      {children}
    </div>
  )
}
