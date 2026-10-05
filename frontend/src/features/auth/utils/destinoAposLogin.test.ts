import { describe, expect, it } from 'vitest'
import { destinoAposLogin } from './destinoAposLogin'

// O ProtectedRoute guarda a página que o usuário tentou abrir (`location`). Depois do login volta-se a ELA, com os filtros,
// a página e o ancora: antes só o caminho era mantido, e um link /solicitacoes?status=aberto&pagina=2 virava /solicitacoes.
describe('destinoAposLogin', () => {
  it('sem página de origem, vai ao dashboard', () => {
    expect(destinoAposLogin(null)).toBe('/')
    expect(destinoAposLogin(undefined)).toBe('/')
    expect(destinoAposLogin({})).toBe('/')
  })

  it('volta ao caminho, à query string e ao fragmento da página pedida', () => {
    expect(destinoAposLogin({ from: { pathname: '/solicitacoes', search: '?status=aberto&pagina=2', hash: '#topo' } })).toBe(
      '/solicitacoes?status=aberto&pagina=2#topo',
    )
    expect(destinoAposLogin({ from: { pathname: '/solicitacoes/4' } })).toBe('/solicitacoes/4')
    expect(destinoAposLogin({ from: { pathname: '/solicitacoes', search: '' } })).toBe('/solicitacoes')
  })

  // O estado do roteador é interno, mas um destino vindo dele nunca deve poder mandar o usuário para outro site.
  it.each(['https://outro-site.com/x', '//outro-site.com/x', 'javascript:alert(1)', 'solicitacoes'])(
    'recusa destino que não é um caminho interno: %s',
    (pathname) => {
      expect(destinoAposLogin({ from: { pathname } })).toBe('/')
    },
  )

  it('não volta ao próprio login (evitaria um laço)', () => {
    expect(destinoAposLogin({ from: { pathname: '/login', search: '?x=1' } })).toBe('/')
  })
})
