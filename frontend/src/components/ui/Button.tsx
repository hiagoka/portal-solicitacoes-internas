import type { ComponentPropsWithoutRef } from 'react'
import { botaoClasses, type ButtonSize, type ButtonVariant } from './buttonStyles'
import { Spinner } from './Spinner'

type ButtonProps = ComponentPropsWithoutRef<'button'> & {
  variant?: ButtonVariant
  size?: ButtonSize
  /** Mostra um spinner e bloqueia o clique (evita envio duplicado de formulários). */
  loading?: boolean
  fullWidth?: boolean
}

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
      className={botaoClasses(variant, size, fullWidth, className)}
      {...props}
    >
      {loading && <Spinner size="sm" label="Processando" />}
      {children}
    </button>
  )
}
