import { cn } from '@/lib/cn'
import type { ToastItem } from './toastContext'

type ToastProps = {
  toast: ToastItem
  onClose: (id: number) => void
}

const BORDAS = {
  sucesso: 'border-l-success',
  erro: 'border-l-danger',
  info: 'border-l-primary',
} as const

// Uma notificação. Erros usam role="alert" (lido na hora); as demais, role="status" (lido sem interromper).
export function Toast({ toast, onClose }: ToastProps) {
  return (
    <div
      role={toast.tipo === 'erro' ? 'alert' : 'status'}
      className={cn(
        'flex items-start gap-3 rounded-md border border-l-4 border-border bg-surface px-4 py-3 text-sm text-text shadow-lg',
        BORDAS[toast.tipo],
      )}
    >
      <p className="flex-1">{toast.mensagem}</p>
      <button
        type="button"
        onClick={() => onClose(toast.id)}
        aria-label="Fechar notificação"
        className="-mr-1 rounded px-1 text-lg leading-none text-textMuted hover:text-text focus-visible:outline-2 focus-visible:outline-primary"
      >
        ×
      </button>
    </div>
  )
}
