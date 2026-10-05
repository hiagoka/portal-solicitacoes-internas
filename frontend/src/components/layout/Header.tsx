import { NavLink, Link } from 'react-router'
import { Badge, Button } from '@/components/ui'
import { PERFIL_LABEL, ROTAS } from '@/constants'
import { useAuth, useToast } from '@/hooks'
import { cn } from '@/lib/cn'
import { ThemeToggle } from './ThemeToggle'

const LINKS = [
  { to: ROTAS.dashboard, texto: 'Dashboard', exato: true },
  { to: ROTAS.solicitacoes, texto: 'Solicitações', exato: false },
] as const

function classeDoLink({ isActive }: { isActive: boolean }) {
  return cn(
    'flex min-h-10 items-center rounded-md px-3 text-sm font-medium transition-colors',
    isActive ? 'bg-primary/10 text-primary' : 'text-textMuted hover:text-text',
  )
}

// Em telas largas: marca, navegação e ações na mesma linha. No celular: marca e ações em cima, navegação embaixo
// (a ordem visual muda por CSS; no HTML a leitura continua marca → navegação → ações).
export function Header() {
  const { usuario, logout } = useAuth()
  const toast = useToast()
  async function sair() {
    try {
      await logout()
    } catch {
      toast.erro('Não foi possível encerrar a sessão. Verifique sua conexão e tente novamente.')
    }
  }

  const perfil = usuario && <Badge tone="primary">{PERFIL_LABEL[usuario.perfil]}</Badge>

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2">
        <Link to={ROTAS.dashboard} className="order-1 py-1 text-base font-semibold text-text">
          Portal de Solicitações
        </Link>

        <nav aria-label="Principal" className="order-3 flex w-full items-center gap-1 md:order-2 md:w-auto">
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.exato} className={classeDoLink}>
              {link.texto}
            </NavLink>
          ))}
          {/* No celular o nome não cabe na primeira linha: só o perfil aparece, no fim da linha da navegação. */}
          <span className="ml-auto sm:hidden">{perfil}</span>
        </nav>

        <div className="order-2 ml-auto flex items-center gap-2 md:order-3">
          {usuario && (
            <div className="hidden items-center gap-2 pr-2 sm:flex">
              <span className="text-sm text-text">{usuario.nome}</span>
              {perfil}
            </div>
          )}
          <ThemeToggle />
          <Button variant="secondary" onClick={() => void sair()}>
            Sair
          </Button>
        </div>
      </div>
    </header>
  )
}
