import { Navigate } from 'react-router'
import { ThemeToggle } from '@/components/layout'
import { Card, Spinner } from '@/components/ui'
import { useAuth, useTituloDaPagina } from '@/hooks'
import { LoginForm } from '../components/LoginForm'
import { useDestinoPosLogin } from '../hooks/useDestinoPosLogin'

export function LoginPage() {
  const { usuario, carregando } = useAuth()
  useTituloDaPagina('Entrar')
  const destino = useDestinoPosLogin()

  // Enquanto o app ainda verifica se já existe uma sessão, NÃO mostra o formulário: quem está logado o veria piscar (e
  // ele tomaria o foco do teclado, perdendo o que fosse digitado) antes de ser redirecionado. É o mesmo cuidado do ProtectedRoute.
  if (carregando) {
    return (
      <main className="flex min-h-screen items-center justify-center text-primary">
        <Spinner size="lg" label="Verificando sessão" />
      </main>
    )
  }

  // Quem já está logado não precisa ver o login.
  if (usuario) return <Navigate to={destino} replace />

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-2xl font-semibold text-text">Portal de Solicitações</h1>
        <p className="mb-6 text-center text-sm text-textMuted">Entre para acompanhar suas solicitações internas.</p>
        <Card padding="lg">
          <LoginForm />
        </Card>
        {import.meta.env.DEV && (
          <p className="mt-4 text-center text-xs text-textMuted">
            Desenvolvimento: usuários maria, joao e atendente, senha senha123.
          </p>
        )}
      </div>
    </main>
  )
}
