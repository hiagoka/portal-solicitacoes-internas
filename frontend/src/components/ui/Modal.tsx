import { useEffect, useId, useRef, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  size?: 'sm' | 'md' | 'lg'
  /** Área de botões no rodapé (ex.: Cancelar / Confirmar). */
  footer?: ReactNode
  children: ReactNode
}

const LARGURAS = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
} as const

// Usa o elemento nativo <dialog>: o navegador cuida de prender o foco dentro do modal, de fechar com Esc
// e de bloquear o resto da página, comportamentos difíceis de acertar manualmente.
export function Modal({ open, onClose, title, size = 'md', footer, children }: ModalProps) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const tituloId = useId()

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={tituloId}
      onClose={onClose} // disparado ao fechar com Esc
      onClick={(evento) => {
        if (evento.target === evento.currentTarget) onClose() // clique no fundo escurecido
      }}
      className={cn(
        'm-auto w-[calc(100%-2rem)] rounded-lg border border-border bg-surface p-0 text-text shadow-lg',
        'backdrop:bg-overlay',
        LARGURAS[size],
      )}
    >
      <div className="flex items-start justify-between gap-4 px-6 pt-5">
        <h2 id={tituloId} className="text-lg font-semibold">
          {title}
        </h2>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="-mr-2 rounded-md px-2 text-2xl leading-none text-textMuted hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
        >
          ×
        </button>
      </div>
      <div className="px-6 py-4 text-sm">{children}</div>
      {footer && <div className="flex justify-end gap-2 border-t border-border px-6 py-4">{footer}</div>}
    </dialog>
  )
}
