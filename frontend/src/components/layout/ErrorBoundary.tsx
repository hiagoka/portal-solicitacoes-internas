import { Component, type ErrorInfo, type ReactNode } from 'react'
import { Button, EmptyState } from '@/components/ui'

type Props = {
  children: ReactNode
  /** Quando `true`, o fallback ocupa a página inteira (usado fora do layout, onde não há cabeçalho nem rotas). */
  paginaInteira?: boolean
}
type Estado = { erro: Error | null }

// Rede de segurança para erros de RENDERIZAÇÃO (por exemplo, a API devolver um dado fora do contrato e um componente
// quebrar ao desenhá-lo). Sem isto o React descarta a árvore inteira e o usuário fica diante de uma tela em branco, sem
// cabeçalho nem como sair dali. Com isto o erro fica contido: mostra uma mensagem, mantém o resto da tela e oferece
// "Tentar novamente". Só componentes de classe podem ser limites de erro no React.
export class ErrorBoundary extends Component<Props, Estado> {
  state: Estado = { erro: null }

  static getDerivedStateFromError(erro: Error): Estado {
    return { erro }
  }

  componentDidCatch(erro: Error, info: ErrorInfo) {
    console.error('Erro de renderização:', erro, info.componentStack)
  }

  private tentarNovamente = () => this.setState({ erro: null })

  render() {
    if (!this.state.erro) return this.props.children

    const conteudo = (
      <div role="alert">
        <EmptyState
          titleAs="h1"
          title="Algo deu errado"
          description="Ocorreu um erro inesperado ao exibir esta tela. Você pode tentar novamente ou voltar ao início."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Button onClick={this.tentarNovamente}>Tentar novamente</Button>
              <a href="/" className="inline-flex h-10 items-center rounded-md border border-border bg-surface px-4 text-sm font-medium text-text hover:bg-background">
                Voltar ao início
              </a>
            </div>
          }
        />
      </div>
    )
    return this.props.paginaInteira ? <main className="flex min-h-screen items-center justify-center px-4">{conteudo}</main> : conteudo
  }
}
