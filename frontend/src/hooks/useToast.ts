import { useContext } from 'react'
import { ToastContext } from '@/components/ui/toastContext'

// Uso: const toast = useToast(); toast.sucesso('Solicitação criada.')
export function useToast() {
  const contexto = useContext(ToastContext)
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>')
  return contexto
}
