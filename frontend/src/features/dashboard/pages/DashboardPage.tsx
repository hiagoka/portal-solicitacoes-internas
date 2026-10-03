import { Card } from '@/components/ui'
import { useAuth } from '@/hooks'

// Provisório: será substituído pelos indicadores na fase do dashboard.
export function DashboardPage() {
  const { usuario } = useAuth()

  return (
    <Card>
      <h1 className="text-xl font-semibold text-text">Olá, {usuario?.nome}</h1>
      <p className="mt-1 text-textMuted">Os indicadores aparecerão aqui.</p>
    </Card>
  )
}
