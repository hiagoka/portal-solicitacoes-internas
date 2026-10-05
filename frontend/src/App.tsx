import { BrowserRouter } from 'react-router'
import { ToastProvider } from '@/components/ui'
import { ErrorBoundary } from '@/components/layout'
import { AuthProvider } from '@/contexts'
import { AppRoutes } from '@/routes/AppRoutes'

// Só monta os provedores globais e as rotas. Nenhuma regra de tela vive aqui.
export default function App() {
  return (
    <ErrorBoundary paginaInteira>
      <BrowserRouter>
        <ToastProvider>
          <AuthProvider>
            <AppRoutes />
          </AuthProvider>
        </ToastProvider>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
