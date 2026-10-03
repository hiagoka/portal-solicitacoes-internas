import { useId, type ComponentPropsWithoutRef } from 'react'
import { campoClasses, descricaoDoCampo } from './fieldStyles'
import { FormField } from './FormField'

export type SelectOption = { value: string; label: string }

type SelectProps = Omit<ComponentPropsWithoutRef<'select'>, 'children'> & {
  options: readonly SelectOption[]
  label?: string
  error?: string
  hint?: string
  /** Opção inicial sem valor (ex.: "Todos", "Selecione..."). */
  placeholder?: string
}

export function Select({ options, label, error, hint, placeholder, id, className, required, ...props }: SelectProps) {
  const idAutomatico = useId()
  const campoId = id ?? idAutomatico

  return (
    <FormField id={campoId} label={label} error={error} hint={hint} required={required}>
      <select
        id={campoId}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={descricaoDoCampo(campoId, error, hint)}
        className={campoClasses(!!error, `h-10 ${className ?? ''}`)}
        {...props}
      >
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((opcao) => (
          <option key={opcao.value} value={opcao.value}>
            {opcao.label}
          </option>
        ))}
      </select>
    </FormField>
  )
}
