import { describe, expect, it } from 'vitest'
import { CATEGORIAS_LISTA, CATEGORIA_LABEL, ROTAS, STATUS_CLASSES, STATUS_LABEL, STATUS_LISTA, STATUS_TRANSICOES } from '.'

describe('constantes', () => {
  it('todo status tem label, classes de cor e transições', () => {
    for (const status of STATUS_LISTA) {
      expect(STATUS_LABEL[status]).toBeTruthy()
      expect(STATUS_CLASSES[status].texto).toMatch(/^text-status-/)
      expect(STATUS_CLASSES[status].fundo).toMatch(/^bg-status-.*\/10$/)
      expect(STATUS_TRANSICOES[status]).toBeDefined()
    }
  })

  it('as transições só apontam para status válidos e nunca para o próprio status', () => {
    for (const [de, destinos] of Object.entries(STATUS_TRANSICOES)) {
      for (const para of destinos) {
        expect(STATUS_LISTA).toContain(para)
        expect(para).not.toBe(de)
      }
    }
  })

  it('"concluído" não volta direto para "aberto" (mesma regra da API)', () => {
    expect(STATUS_TRANSICOES.concluido).not.toContain('aberto')
  })

  it('toda categoria tem label', () => {
    expect(CATEGORIAS_LISTA).toHaveLength(5)
    for (const categoria of CATEGORIAS_LISTA) expect(CATEGORIA_LABEL[categoria]).toBeTruthy()
  })

  it('helpers de rota montam os caminhos', () => {
    expect(ROTAS.detalhesSolicitacao(7)).toBe('/solicitacoes/7')
    expect(ROTAS.editarSolicitacao('7')).toBe('/solicitacoes/7/editar')
  })
})
