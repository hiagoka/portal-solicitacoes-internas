import { cn } from '@/lib/cn'

type SpinnerProps = {
  size?: 'sm' | 'md' | 'lg'
  /** Texto lido por leitores de tela. */
  label?: string
  className?: string
}

const TAMANHOS = {
  sm: 'size-4 border-2',
  md: 'size-6 border-2',
  lg: 'size-10 border-4',
} as const

// Indicador de carregamento. Usa a cor do texto ao redor (currentColor), então funciona em qualquer fundo.
export function Spinner({ size = 'md', label = 'Carregando', className }: SpinnerProps) {
  return (
    <span role="status" className={cn('inline-flex', className)}>
      <span
        aria-hidden="true"
        // Quem pede "reduzir movimento" no sistema não vê o giro (movimento contínuo pode causar desconforto); recebe um pulso suave de opacidade.
        className={cn('animate-spin motion-reduce:animate-pulse rounded-full border-current border-t-transparent', TAMANHOS[size])}
      />
      <span className="sr-only">{label}</span>
    </span>
  )
}
