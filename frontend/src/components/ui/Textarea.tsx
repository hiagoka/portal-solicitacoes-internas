import { useId, type ComponentPropsWithoutRef } from 'react'
import { campoClasses, descricaoDoCampo } from './fieldStyles'
import { FormField } from './FormField'

type TextareaProps = ComponentPropsWithoutRef<'textarea'> & {
  label?: string
  error?: string
  hint?: string
}

export function Textarea({ label, error, hint, id, className, required, rows = 4, ...props }: TextareaProps) {
  const idAutomatico = useId()
  const campoId = id ?? idAutomatico

  return (
    <FormField id={campoId} label={label} error={error} hint={hint} required={required}>
      <textarea
        id={campoId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descricaoDoCampo(campoId, error, hint)}
        className={campoClasses(!!error, `resize-y py-2 ${className ?? ''}`)}
        {...props}
      />
    </FormField>
  )
}
