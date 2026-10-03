import { useEffect, useRef } from 'react'
import { Outlet, useLocation } from 'react-router'
import { Header } from './Header'

// Moldura das telas autenticadas: cabeçalho no topo e o conteúdo da rota atual embaixo.
export function AppLayout() {
  const { pathname } = useLocation()
  const principalRef = useRef<HTMLElement>(null)
  const primeiraRenderizacao = useRef(true)

  // Numa aplicação de página única o navegador não "recarrega" ao navegar, então o foco ficaria preso no link
  // clicado. Levamos o foco ao conteúdo a cada troca de rota, para teclado e leitores de tela começarem do ponto certo.
  useEffect(() => {
    if (primeiraRenderizacao.current) {
      primeiraRenderizacao.current = false
      return
    }
    principalRef.current?.focus({ preventScroll: true })
  }, [pathname])

  return (
    <div className="flex min-h-screen flex-col">
      <a
        href="#conteudo"
        onClick={(e) => {
          e.preventDefault()
          principalRef.current?.focus()
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-onPrimary"
      >
        Pular para o conteúdo
      </a>
      <Header />
      <main id="conteudo" ref={principalRef} tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none">
        <Outlet />
      </main>
    </div>
  )
}
