import { Outlet } from 'react-router'
import { Header } from './Header'

// Moldura das telas autenticadas: cabeçalho fixo no topo e o conteúdo da rota atual embaixo.
export function AppLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
