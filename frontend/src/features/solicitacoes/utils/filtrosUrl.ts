import { CATEGORIAS_LISTA, STATUS_LISTA } from '@/constants'
import type { Categoria, Status } from '@/types'

export const OPCOES_POR_PAGINA = [5, 10, 20, 50] as const
export const POR_PAGINA_PADRAO = 10
const LIMITE_BUSCA = 100 // o mesmo limite da API: uma busca maior responderia 400

export interface CamposDeFiltro {
  busca: string
  status: Status | ''
  categoria: Categoria | ''
  de: string // AAAA-MM-DD
  ate: string // AAAA-MM-DD
}

// Tudo o que define o que a listagem mostra. Vive na URL: copiar o link reproduz a mesma tela.
export interface EstadoDaLista {
  filtros: CamposDeFiltro
  pagina: number
  porPagina: number
}

export const estadoPadrao = (): EstadoDaLista => ({
  filtros: { busca: '', status: '', categoria: '', de: '', ate: '' },
  pagina: 1,
  porPagina: POR_PAGINA_PADRAO,
})

const dataIso = (valor: string | null) => (valor && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? valor : '')

// A URL pode ser digitada ou editada por qualquer pessoa. Todo valor inválido é descartado em silêncio (vira o
// padrão) em vez de gerar um erro: um link quebrado deve abrir a lista, não uma tela de falha.
export function lerEstadoDaUrl(params: URLSearchParams): EstadoDaLista {
  const status = params.get('status')
  const categoria = params.get('categoria')
  const pagina = params.get('pagina')
  const porPagina = Number(params.get('porPagina'))

  return {
    filtros: {
      busca: (params.get('busca') ?? '').slice(0, LIMITE_BUSCA),
      status: STATUS_LISTA.includes(status as Status) ? (status as Status) : '',
      categoria: CATEGORIAS_LISTA.includes(categoria as Categoria) ? (categoria as Categoria) : '',
      de: dataIso(params.get('de')),
      ate: dataIso(params.get('ate')),
    },
    pagina: pagina && /^\d+$/.test(pagina) && Number(pagina) >= 1 && Number.isSafeInteger(Number(pagina)) ? Number(pagina) : 1,
    porPagina: (OPCOES_POR_PAGINA as readonly number[]).includes(porPagina) ? porPagina : POR_PAGINA_PADRAO,
  }
}

// Só escreve o que difere do padrão, para a URL ficar curta (a lista sem filtros é só "/solicitacoes").
export function paraParametrosDaUrl({ filtros, pagina, porPagina }: EstadoDaLista): URLSearchParams {
  const params = new URLSearchParams()
  if (filtros.busca) params.set('busca', filtros.busca)
  if (filtros.status) params.set('status', filtros.status)
  if (filtros.categoria) params.set('categoria', filtros.categoria)
  if (filtros.de) params.set('de', filtros.de)
  if (filtros.ate) params.set('ate', filtros.ate)
  if (pagina > 1) params.set('pagina', String(pagina))
  if (porPagina !== POR_PAGINA_PADRAO) params.set('porPagina', String(porPagina))
  return params
}
