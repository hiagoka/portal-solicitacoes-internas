import { Button } from './Button'

type PaginationProps = {
  pagina: number
  totalPaginas: number
  onChange: (pagina: number) => void
  /** Bloqueia os botões enquanto uma nova página carrega. */
  disabled?: boolean
}

// Navegação entre páginas: "Anterior", posição atual e "Próxima".
export function Pagination({ pagina, totalPaginas, onChange, disabled = false }: PaginationProps) {
  return (
    <nav aria-label="Paginação" className="flex items-center gap-2">
      <Button variant="secondary" size="sm" onClick={() => onChange(pagina - 1)} disabled={disabled || pagina <= 1}>
        Anterior
      </Button>
      <span className="px-1 text-sm text-textMuted" aria-live="polite" aria-atomic="true">
        Página {pagina} de {totalPaginas}
      </span>
      <Button variant="secondary" size="sm" onClick={() => onChange(pagina + 1)} disabled={disabled || pagina >= totalPaginas}>
        Próxima
      </Button>
    </nav>
  )
}
