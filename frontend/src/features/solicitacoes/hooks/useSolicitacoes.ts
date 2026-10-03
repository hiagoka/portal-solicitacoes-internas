import { useCallback, useEffect, useState } from 'react'
import { ApiError, solicitacaoService } from '@/services'
import type { FiltrosSolicitacao, Solicitacao } from '@/types'

type Resultado = { chave: string; lista: Solicitacao[] | null; erro: string | null }

// Busca a lista na API sempre que os filtros mudam.
// O resultado guarda a "chave" da busca que o gerou; `carregando` é derivado comparando essa chave com a
// atual, então não é preciso atualizar estado de forma síncrona dentro do efeito. Enquanto uma nova busca
// roda, a lista anterior continua disponível (a tela a mostra esmaecida em vez de piscar).
export function useSolicitacoes(filtros: FiltrosSolicitacao) {
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [tentativa, setTentativa] = useState(0)

  const { status, categoria, busca, de, ate } = filtros
  const chave = JSON.stringify([status, categoria, busca, de, ate, tentativa])

  useEffect(() => {
    // Respostas podem chegar fora de ordem (digitou "a", depois "ab"); só vale a da última busca.
    let obsoleta = false

    solicitacaoService
      .listar({ status, categoria, busca, de, ate })
      .then((lista) => !obsoleta && setResultado({ chave, lista, erro: null }))
      .catch((e: unknown) => {
        if (obsoleta) return
        const mensagem = e instanceof ApiError ? e.message : 'Não foi possível carregar as solicitações.'
        setResultado({ chave, lista: null, erro: mensagem })
      })

    return () => {
      obsoleta = true
    }
  }, [chave, status, categoria, busca, de, ate])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  const atual = resultado?.chave === chave
  return {
    solicitacoes: resultado?.lista ?? null,
    carregando: !atual,
    erro: atual ? resultado.erro : null,
    recarregar,
  }
}
