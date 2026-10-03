import { Route, Routes } from 'react-router'
import { AppLayout, ProtectedRoute } from '@/components/layout'
import { ROTAS } from '@/constants'
import { LoginPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard'
import { ListaSolicitacoesPage } from '@/features/solicitacoes'
import { NotFoundPage } from '@/pages/NotFoundPage'

// Mapa de rotas. Tudo dentro de <ProtectedRoute> exige login e aparece dentro do <AppLayout>.
export function AppRoutes() {
  return (
    <Routes>
      <Route path={ROTAS.login} element={<LoginPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path={ROTAS.dashboard} element={<DashboardPage />} />
          <Route path={ROTAS.solicitacoes} element={<ListaSolicitacoesPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  )
}
