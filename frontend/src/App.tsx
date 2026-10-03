import { BrowserRouter } from 'react-router'
import { ToastProvider } from '@/components/ui'
import { AuthProvider } from '@/contexts'
import { AppRoutes } from '@/routes/AppRoutes'

// Só monta os provedores globais e as rotas. Nenhuma regra de tela vive aqui.
export default function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  )
}
