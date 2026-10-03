import { useCallback, useEffect, useRef, useState } from 'react'
import { ApiError } from '@/services'

type Resultado<T> = { chave: string; dados: T | null; erro: Error | null }

type Opcoes = {
  /** Mensagem usada quando a falha não é um erro da API (ex.: bug inesperado). */
  mensagemErro?: string
  /** Enquanto uma nova busca roda, continua devolvendo os dados da anterior (a tela pode esmaecê-los). */
  manterAnterior?: boolean
}

// Busca de dados para telas de leitura. `chave` identifica a busca: quando ela muda, uma nova busca roda.
//
// O resultado guarda a chave que o gerou, e `carregando`/`erro` são DERIVADOS comparando-a com a atual.
// Assim não há `setState` síncrono dentro do efeito, e a resposta de uma busca antiga que chega atrasada
// (digitou "a", depois "ab") é descartada em vez de sobrescrever a mais nova.
export function useConsulta<T>(chave: string, buscar: () => Promise<T>, opcoes: Opcoes = {}) {
  const { mensagemErro = 'Não foi possível carregar os dados.', manterAnterior = false } = opcoes
  const [resultado, setResultado] = useState<Resultado<T> | null>(null)
  const [tentativa, setTentativa] = useState(0)
  const chaveCompleta = `${chave}#${tentativa}`

  // A função de busca é recriada a cada render; guardamos a mais recente sem fazê-la disparar o efeito.
  const buscarRef = useRef(buscar)
  useEffect(() => {
    buscarRef.current = buscar
  })

  useEffect(() => {
    let obsoleta = false
    buscarRef
      .current()
      .then((dados) => !obsoleta && setResultado({ chave: chaveCompleta, dados, erro: null }))
      .catch((e: unknown) => {
        if (obsoleta) return
        const erro = e instanceof ApiError ? e : new Error(mensagemErro)
        setResultado({ chave: chaveCompleta, dados: null, erro })
      })
    return () => {
      obsoleta = true
    }
  }, [chaveCompleta, mensagemErro])

  const recarregar = useCallback(() => setTentativa((n) => n + 1), [])

  // Troca o dado em memória (ex.: depois de mudar o status) sem nova ida à API.
  const substituir = useCallback(
    (dados: T) => setResultado({ chave: chaveCompleta, dados, erro: null }),
    [chaveCompleta],
  )

  const atual = resultado?.chave === chaveCompleta
  return {
    dados: atual || manterAnterior ? (resultado?.dados ?? null) : null,
    carregando: !atual,
    erro: atual ? resultado.erro : null,
    recarregar,
    substituir,
  }
}
