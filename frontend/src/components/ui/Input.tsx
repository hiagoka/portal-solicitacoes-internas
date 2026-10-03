import { useId, type ComponentPropsWithoutRef } from 'react'
import { campoClasses, descricaoDoCampo } from './fieldStyles'
import { FormField } from './FormField'

type InputProps = ComponentPropsWithoutRef<'input'> & {
  label?: string
  error?: string
  hint?: string
}

export function Input({ label, error, hint, id, className, required, ...props }: InputProps) {
  const idAutomatico = useId()
  const campoId = id ?? idAutomatico

  return (
    <FormField id={campoId} label={label} error={error} hint={hint} required={required}>
      <input
        id={campoId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descricaoDoCampo(campoId, error, hint)}
        className={campoClasses(!!error, `h-10 ${className ?? ''}`)}
        {...props}
      />
    </FormField>
  )
}
