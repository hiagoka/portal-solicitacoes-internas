import type { ErroApi, ErroCampo } from '@/types'

const BASE_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')

// Erro lançado para qualquer resposta de falha. `status` 0 significa "não conseguiu falar com a API".
export class ApiError extends Error {
  readonly status: number
  readonly detalhes?: ErroCampo[]

  constructor(status: number, mensagem: string, detalhes?: ErroCampo[]) {
    super(mensagem)
    this.name = 'ApiError'
    this.status = status
    this.detalhes = detalhes
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
type Query = Record<string, string | number | undefined>

interface Opcoes {
  body?: unknown
  query?: Query
}

// Chamado quando uma rota protegida responde 401 (sessão expirada). O AuthContext registra aqui
// a sua função para levar o usuário de volta ao login.
let aoExpirarSessao: (() => void) | null = null
export function definirAoExpirarSessao(callback: (() => void) | null) {
  aoExpirarSessao = callback
}

// 401 esperado e que não indica sessão expirada: senha errada no login e "ninguém logado" na carga inicial.
const ROTAS_SEM_AVISO_DE_SESSAO = ['/auth/login', '/auth/me']

function montarUrl(caminho: string, query?: Query) {
  const params = new URLSearchParams()
  for (const [chave, valor] of Object.entries(query ?? {})) {
    if (valor !== undefined && valor !== '') params.set(chave, String(valor))
  }
  const texto = params.toString()
  return `${BASE_URL}${caminho}${texto ? `?${texto}` : ''}`
}

async function requisitar<T>(metodo: Metodo, caminho: string, { body, query }: Opcoes = {}): Promise<T> {
  let resposta: Response
  try {
    resposta = await fetch(montarUrl(caminho, query), {
      method: metodo,
      credentials: 'include', // envia e recebe o cookie de sessão (httpOnly)
      headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
  } catch {
    throw new ApiError(0, 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.')
  }

  if (resposta.status === 204) return undefined as T

  const dados: unknown = await resposta.json().catch(() => null)

  if (!resposta.ok) {
    const erro = (dados ?? {}) as Partial<ErroApi>
    if (resposta.status === 401 && !ROTAS_SEM_AVISO_DE_SESSAO.includes(caminho)) aoExpirarSessao?.()
    throw new ApiError(resposta.status, erro.erro ?? 'Ocorreu um erro inesperado.', erro.detalhes)
  }

  return dados as T
}

export const http = {
  get: <T>(caminho: string, query?: Query) => requisitar<T>('GET', caminho, { query }),
  post: <T>(caminho: string, body?: unknown) => requisitar<T>('POST', caminho, { body }),
  put: <T>(caminho: string, body?: unknown) => requisitar<T>('PUT', caminho, { body }),
  patch: <T>(caminho: string, body?: unknown) => requisitar<T>('PATCH', caminho, { body }),
  delete: <T>(caminho: string) => requisitar<T>('DELETE', caminho),
}
