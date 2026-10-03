import type { ReactNode } from 'react'

type FormFieldProps = {
  id: string
  label?: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactNode
}

// Moldura comum dos campos de formulário: rótulo, controle, mensagem de erro ou dica.
export function FormField({ id, label, error, hint, required, children }: FormFieldProps) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-text">
          {label}
          {required && (
            <span aria-hidden="true" className="text-danger">
              {' '}
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={`${id}-erro`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-dica`} className="text-sm text-textMuted">
            {hint}
          </p>
        )
      )}
    </div>
  )
}
