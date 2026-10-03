import { cn } from '@/lib/cn'

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

const VARIANTES: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-onPrimary hover:bg-primaryHover',
  secondary: 'border border-border bg-surface text-text hover:bg-background',
  danger: 'bg-danger text-onDanger hover:bg-dangerHover',
  ghost: 'text-secondary hover:bg-background hover:text-text',
}

const TAMANHOS: Record<ButtonSize, string> = {
  sm: 'h-8 gap-1.5 px-3 text-sm',
  md: 'h-10 gap-2 px-4 text-sm',
  lg: 'h-12 gap-2 px-6 text-base',
}

// Visual compartilhado por Button (<button>) e LinkButton (<a>): os dois ficam idênticos.
export function botaoClasses(variant: ButtonVariant, size: ButtonSize, fullWidth = false, extra?: string) {
  return cn(
    'inline-flex items-center justify-center rounded-md font-medium transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
    'disabled:cursor-not-allowed disabled:opacity-60',
    VARIANTES[variant],
    TAMANHOS[size],
    fullWidth && 'w-full',
    extra,
  )
}
