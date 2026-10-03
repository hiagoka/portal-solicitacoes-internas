import { useCallback, useEffect, useState } from 'react'
import { ApiError, solicitacaoService } from '@/services'
import type { Solicitacao } from '@/types'

type Resultado = { chave: string; solicitacao: Solicitacao | null; erro: ApiError | Error | null }

// Busca uma solicitação pelo código. Mesmo padrão do useSolicitacoes: `carregando` é derivado da chave da busca.
export function useSolicitacao(id: number) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const chave = `${id}:${tentativa}`

  useEffect(() => {
    let obsoleta = false
    solicitacaoService
      .obter(id)
      .then((solicitacao) => !obsoleta && setResultado({ chave, solicitacao, erro: null }))
      .catch((e: unknown) => {
        if (obsoleta) return
        const erro = e instanceof Error ? e : new Error('Erro inesperado')
        setResultado({ chave, solicitacao: null, erro })
      })
    return () => {
      obsoleta = true
    }
  }, [id, chave])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  // Troca o dado em memória (ex.: depois de mudar o status) sem nova ida à API.
  const substituir = useCallback(
    (solicitacao: Solicitacao) => setResultado({ chave, solicitacao, erro: null }),
    [chave],
  )

  const atual = resultado?.chave === chave
  const erro = atual ? resultado.erro : null
  return {
    solicitacao: atual ? resultado.solicitacao : null,
    carregando: !atual,
    erro,
    naoEncontrada: erro instanceof ApiError && erro.status === 404,
    recarregar,
    substituir,
  }
}
