import { describe, expect, it } from 'vitest'
import { formatarCodigo, formatarData, formatarDataHora, formatarIntervalo } from './formatar'

describe('formatar', () => {
  it('formata a data no padrão brasileiro', () => {
    expect(formatarData('2026-10-03T16:02:23.217Z')).toBe('03/10/2026')
  })

  it('usa o dia de Brasília, não o de UTC (22h em Brasília já é o dia seguinte em UTC)', () => {
    // 2026-10-04 01:30 UTC = 2026-10-03 22:30 em Brasília
    expect(formatarData('2026-10-04T01:30:00Z')).toBe('03/10/2026')
    expect(formatarDataHora('2026-10-04T01:30:00Z')).toBe('03/10/2026 22:30')
  })

  it('completa o código com zeros à esquerda', () => {
    expect(formatarCodigo(7)).toBe('#0007')
    expect(formatarCodigo(1234)).toBe('#1234')
    expect(formatarCodigo(12345)).toBe('#12345')
  })

  it('mostra a faixa de itens da página', () => {
    expect(formatarIntervalo(1, 10, 23)).toBe('1–10 de 23')
    expect(formatarIntervalo(2, 10, 23)).toBe('11–20 de 23')
    expect(formatarIntervalo(3, 10, 23)).toBe('21–23 de 23') // última página, incompleta
    expect(formatarIntervalo(1, 10, 1)).toBe('1–1 de 1')
    expect(formatarIntervalo(1, 10, 0)).toBe('0 de 0')
  })
})
