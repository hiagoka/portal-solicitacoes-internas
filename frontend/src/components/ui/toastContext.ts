import { createContext } from 'react'

export type ToastTipo = 'sucesso' | 'erro' | 'info'

export interface ToastItem {
  id: number
  tipo: ToastTipo
  mensagem: string
}

export interface ToastContextValue {
  sucesso: (mensagem: string) => void
  erro: (mensagem: string) => void
  info: (mensagem: string) => void
}

export const ToastContext = createContext<ToastContextValue | null>(null)
