import { useEffect } from 'react'

const NOME_DO_SISTEMA = 'Portal de Solicitações'

// Define o título da aba ("Solicitações · Portal de Solicitações"). Leitores de tela anunciam o título ao
// trocar de página, e ele identifica a aba no histórico do navegador.
export function useTituloDaPagina(titulo: string | undefined) {
  useEffect(() => {
    if (!titulo) return
    document.title = `${titulo} · ${NOME_DO_SISTEMA}`
    return () => {
      document.title = NOME_DO_SISTEMA
    }
  }, [titulo])
}
