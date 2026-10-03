import type { ComponentPropsWithoutRef } from 'react'
import { cn } from '@/lib/cn'
import { Spinner } from './Spinner'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  /** Mostra um spinner e bloqueia o clique (evita envio duplicado de formulários). */
  loading?: boolean
  fullWidth?: boolean
}

const VARIANTES = {
  primary: 'bg-primary text-onPrimary hover:bg-primaryHover',
  secondary: 'border border-border bg-surface text-text hover:bg-background',
  danger: 'bg-danger text-onDanger hover:bg-dangerHover',
  ghost: 'text-secondary hover:bg-background hover:text-text',
} as const

const TAMANHOS = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
} as const

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  fullWidth = false,
  disabled,
  className,
  children,
  type = 'button', // evita enviar formulários sem querer
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
        'disabled:cursor-not-allowed disabled:opacity-60',
        VARIANTES[variant],
        TAMANHOS[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    >
      {loading && <Spinner size="sm" label="Processando" />}
      {children}
    </button>
  )
}
