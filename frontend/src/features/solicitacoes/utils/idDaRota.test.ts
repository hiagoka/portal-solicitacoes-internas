import { describe, expect, it } from 'vitest'
import { lerIdDaRota } from './idDaRota'

// O código na URL (/solicitacoes/:id) só é válido na forma canônica e dentro do INTEGER do banco: o mesmo critério da API.
// Qualquer outra coisa é tratada como "solicitação não encontrada", sem nem consultar a API.
describe('lerIdDaRota', () => {
  it.each([['1', 1], ['42', 42], ['2147483647', 2147483647]])('aceita o código %s', (texto, esperado) => {
    expect(lerIdDaRota(texto)).toBe(esperado)
  })

  it.each([
    ['ausente', undefined],
    ['vazio', ''],
    ['não numérico', 'abc'],
    ['zero', '0'],
    ['negativo', '-3'],
    ['decimal', '1.5'],
    ['zeros à esquerda', '0001'],
    ['notação científica', '1e3'],
    ['hexadecimal', '0x10'],
    ['com sinal', '+5'],
    ['com espaço', '%201'],
    ['acima do INTEGER do banco', '2147483648'],
    ['absurdamente grande', '99999999999999999999'],
  ])('rejeita %s (devolve NaN)', (_nome, texto) => {
    expect(lerIdDaRota(texto)).toBeNaN()
  })
})
