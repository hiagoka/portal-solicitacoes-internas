import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ApiError, definirAoExpirarSessao, http } from './httpClient'

const fetchMock = vi.fn()

function resposta(status: number, corpo?: unknown) {
  return new Response(corpo === undefined ? null : JSON.stringify(corpo), { status })
}

beforeEach(() => vi.stubGlobal('fetch', fetchMock))
afterEach(() => {
  fetchMock.mockReset()
  definirAoExpirarSessao(null)
  vi.unstubAllGlobals()
})

describe('httpClient', () => {
  it('envia cookies, usa a URL base e devolve o JSON', async () => {
    fetchMock.mockResolvedValue(resposta(200, { ok: true }))

    const dados = await http.get<{ ok: boolean }>('/health')

    expect(dados).toEqual({ ok: true })
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('http://localhost:3000/health')
    expect(init).toMatchObject({ method: 'GET', credentials: 'include' })
  })

  it('serializa o corpo como JSON com o Content-Type correto', async () => {
    fetchMock.mockResolvedValue(resposta(200, {}))

    await http.post('/auth/login', { usuario: 'maria', senha: 'x' })

    const init = fetchMock.mock.calls[0][1]
    expect(init.method).toBe('POST')
    expect(init.headers).toEqual({ 'Content-Type': 'application/json' })
    expect(JSON.parse(init.body)).toEqual({ usuario: 'maria', senha: 'x' })
  })

  it('monta a query string ignorando valores vazios e indefinidos', async () => {
    fetchMock.mockResolvedValue(resposta(200, {}))

    await http.get('/solicitacoes', { status: 'aberto', busca: '', de: undefined, categoria: 'TI' })

    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/solicitacoes?status=aberto&categoria=TI')
  })

  it('codifica caracteres especiais na query', async () => {
    fetchMock.mockResolvedValue(resposta(200, {}))
    await http.get('/solicitacoes', { busca: 'nota & fiscal' })
    expect(fetchMock.mock.calls[0][0]).toBe('http://localhost:3000/solicitacoes?busca=nota+%26+fiscal')
  })

  it('devolve undefined em respostas 204', async () => {
    fetchMock.mockResolvedValue(resposta(204))
    await expect(http.delete('/solicitacoes/1')).resolves.toBeUndefined()
  })

  it('converte o erro da API em ApiError com status, mensagem e detalhes', async () => {
    const detalhes = [{ campo: 'titulo', mensagem: 'Título muito curto' }]
    fetchMock.mockResolvedValue(resposta(400, { erro: 'Dados inválidos', detalhes }))

    const erro = await http.post('/solicitacoes', {}).catch((e) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect(erro).toMatchObject({ status: 400, message: 'Dados inválidos', detalhes })
  })

  it('usa uma mensagem padrão quando o erro não vem em JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Bad Gateway</html>', { status: 502 }))
    const erro = await http.get('/dashboard').catch((e) => e)
    expect(erro).toMatchObject({ status: 502, message: 'Ocorreu um erro inesperado.' })
  })

  it('trata falha de rede como ApiError de status 0', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'))
    const erro = (await http.get('/dashboard').catch((e: unknown) => e)) as ApiError
    expect(erro).toBeInstanceOf(ApiError)
    expect(erro.status).toBe(0)
    expect(erro.message).toMatch(/conectar ao servidor/)
  })

  describe('sessão expirada', () => {
    it('avisa a aplicação quando uma rota protegida responde 401', async () => {
      const aviso = vi.fn()
      definirAoExpirarSessao(aviso)
      fetchMock.mockResolvedValue(resposta(401, { erro: 'Não autenticado' }))

      await http.get('/solicitacoes').catch(() => undefined)

      expect(aviso).toHaveBeenCalledOnce()
    })

    it.each(['/auth/login', '/auth/me'])('NÃO avisa em %s (401 esperado)', async (caminho) => {
      const aviso = vi.fn()
      definirAoExpirarSessao(aviso)
      fetchMock.mockResolvedValue(resposta(401, { erro: 'x' }))

      await http.post(caminho, {}).catch(() => undefined)

      expect(aviso).not.toHaveBeenCalled()
    })
  })
})
