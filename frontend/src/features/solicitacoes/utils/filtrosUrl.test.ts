import { describe, expect, it } from 'vitest'
import { estadoPadrao, lerEstadoDaUrl, paraParametrosDaUrl, type CamposDeFiltro } from './filtrosUrl'

type Esperado = { pagina?: number; porPagina?: number; filtros?: Partial<CamposDeFiltro> }

const ler = (consulta: string) => lerEstadoDaUrl(new URLSearchParams(consulta))

describe('lerEstadoDaUrl', () => {
  it('sem parâmetros: nenhum filtro, página 1 e 10 por página', () => {
    expect(ler('')).toEqual(estadoPadrao())
  })

  it('lê todos os filtros e a paginação', () => {
    expect(ler('busca=nota&status=aberto&categoria=TI&de=2026-09-01&ate=2026-10-01&pagina=3&porPagina=20')).toEqual({
      filtros: { busca: 'nota', status: 'aberto', categoria: 'TI', de: '2026-09-01', ate: '2026-10-01' },
      pagina: 3,
      porPagina: 20,
    })
  })

  // A URL pode ser digitada ou editada por qualquer pessoa: valores inválidos são descartados (e não viram erro).
  it.each<[string, string, Esperado]>([
    ['status desconhecido', 'status=xyz', { filtros: { status: '' } }],
    ['categoria desconhecida', 'categoria=Marketing', { filtros: { categoria: '' } }],
    ['data em formato errado', 'de=01/10/2026&ate=ontem', { filtros: { de: '', ate: '' } }],
    ['página zero', 'pagina=0', { pagina: 1 }],
    ['página negativa', 'pagina=-3', { pagina: 1 }],
    ['página não numérica', 'pagina=abc', { pagina: 1 }],
    ['página decimal', 'pagina=1.5', { pagina: 1 }],
    ['tamanho fora das opções', 'porPagina=7', { porPagina: 10 }],
    ['tamanho acima do limite', 'porPagina=500', { porPagina: 10 }],
  ])('descarta valor inválido: %s', (_nome, consulta, esperado) => {
    const estado = ler(consulta)
    expect(estado.pagina).toBe(esperado.pagina ?? 1)
    expect(estado.porPagina).toBe(esperado.porPagina ?? 10)
    expect(estado.filtros).toMatchObject(esperado.filtros ?? {})
  })

  // A API rejeita datas inexistentes e o ano 0000 (400). Se a URL as deixasse passar, o link abriria uma tela de ERRO em vez da lista.
  it.each([
    ['dia que não existe no mês', '2026-02-31'],
    ['29 de fevereiro em ano comum', '2026-02-29'],
    ['mês 13', '2026-13-01'],
    ['dia zero', '2026-01-00'],
    ['ano 0000', '0000-01-01'],
  ])('descarta data impossível: %s', (_nome, data) => {
    expect(ler(`de=${data}&ate=${data}`).filtros).toMatchObject({ de: '', ate: '' })
  })

  it.each(['2026-02-28', '2024-02-29', '2000-02-29', '0001-01-01', '2026-12-31'])('mantém a data real %s', (data) => {
    expect(ler(`de=${data}`).filtros.de).toBe(data)
  })

  it('limita a busca a 100 caracteres (o limite da API), evitando um erro 400', () => {
    expect(ler(`busca=${'x'.repeat(150)}`).filtros.busca).toHaveLength(100)
  })
})

describe('paraParametrosDaUrl', () => {
  it('estado padrão gera uma URL limpa (sem parâmetros)', () => {
    expect(paraParametrosDaUrl(estadoPadrao()).toString()).toBe('')
  })

  it('omite os valores padrão (página 1, 10 por página, filtros vazios)', () => {
    const estado = { ...estadoPadrao(), filtros: { ...estadoPadrao().filtros, status: 'aberto' as const } }
    expect(paraParametrosDaUrl(estado).toString()).toBe('status=aberto')
  })

  it('inclui página e tamanho quando diferentes do padrão', () => {
    expect(paraParametrosDaUrl({ ...estadoPadrao(), pagina: 2, porPagina: 5 }).toString()).toBe('pagina=2&porPagina=5')
  })

  it('codifica caracteres especiais da busca', () => {
    const estado = { ...estadoPadrao(), filtros: { ...estadoPadrao().filtros, busca: 'nota & fiscal' } }
    expect(paraParametrosDaUrl(estado).toString()).toBe('busca=nota+%26+fiscal')
  })

  it('ler depois de escrever devolve o mesmo estado', () => {
    const original = {
      filtros: { busca: 'cadeira', status: 'em_atendimento' as const, categoria: 'Compras' as const, de: '2026-01-02', ate: '2026-03-04' },
      pagina: 4,
      porPagina: 50,
    }
    expect(lerEstadoDaUrl(paraParametrosDaUrl(original))).toEqual(original)
  })
})
