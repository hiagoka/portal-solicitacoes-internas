import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Toast } from './Toast'
import { ToastContext, type ToastContextValue, type ToastItem, type ToastTipo } from './toastContext'

const DURACAO_MS = 5000

// Fornece `useToast()` a toda a aplicação e desenha a pilha de notificações no canto da tela.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const proximoId = useRef(1)
  const temporizadores = useRef(new Map<number, number>())

  const remover = useCallback((id: number) => {
    window.clearTimeout(temporizadores.current.get(id))
    temporizadores.current.delete(id)
    setToasts((atuais) => atuais.filter((t) => t.id !== id))
  }, [])

  const adicionar = useCallback(
    (tipo: ToastTipo, mensagem: string) => {
      const id = proximoId.current++
      setToasts((atuais) => [...atuais, { id, tipo, mensagem }])
      temporizadores.current.set(id, window.setTimeout(() => remover(id), DURACAO_MS))
    },
    [remover],
  )

  // Ao desmontar, cancela os temporizadores pendentes.
  useEffect(() => {
    const ativos = temporizadores.current
    return () => ativos.forEach((t) => window.clearTimeout(t))
  }, [])

  const valor = useMemo<ToastContextValue>(
    () => ({
      sucesso: (m) => adicionar('sucesso', m),
      erro: (m) => adicionar('erro', m),
      info: (m) => adicionar('info', m),
    }),
    [adicionar],
  )

  return (
    <ToastContext.Provider value={valor}>
      {children}
      <div className="pointer-events-none fixed inset-x-4 bottom-4 z-50 flex flex-col items-end gap-2 sm:left-auto sm:w-96">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto w-full">
            <Toast toast={toast} onClose={remover} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
