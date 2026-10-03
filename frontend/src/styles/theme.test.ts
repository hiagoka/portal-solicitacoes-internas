import { describe, expect, it } from 'vitest'
import { palettes, type Palette } from './theme'

// Contraste WCAG 2.x entre duas cores hexadecimais (#RRGGBB): de 1 (iguais) a 21 (preto sobre branco).
const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16))
const luminancia = (c: number[]) => {
  const [r, g, b] = c.map((v) => v / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
const contraste = (a: number[], b: number[]) => {
  const [maior, menor] = [luminancia(a), luminancia(b)].sort((x, y) => y - x)
  return (maior + 0.05) / (menor + 0.05)
}
// Cor `cor` aplicada com 10% de opacidade sobre `fundo` (é o que as classes bg-xxx/10 fazem nos selos).
const tinta = (cor: number[], fundo: number[]) => cor.map((v, i) => Math.round(v * 0.1 + fundo[i] * 0.9))

const MINIMO_AA = 4.5

describe.each(Object.entries(palettes) as [string, Palette][])('paleta %s: contraste WCAG AA (≥ 4,5:1)', (_nome, p) => {
  const pares: [string, string, string][] = [
    ['texto sobre o fundo da página', p.text, p.background],
    ['texto sobre cartões', p.text, p.surface],
    ['texto secundário sobre o fundo da página', p.textMuted, p.background],
    ['texto secundário sobre cartões', p.textMuted, p.surface],
    ['texto do botão primário', p.onPrimary, p.primary],
    ['texto do botão primário (hover)', p.onPrimary, p.primaryHover],
    ['texto do botão de perigo', p.onDanger, p.danger],
    ['texto do botão de perigo (hover)', p.onDanger, p.dangerHover],
    ['link/realce primário sobre cartões', p.primary, p.surface],
    ['mensagem de erro sobre cartões', p.danger, p.surface],
  ]
  it.each(pares)('%s', (_descricao, texto, fundo) => {
    expect(contraste(rgb(texto), rgb(fundo))).toBeGreaterThanOrEqual(MINIMO_AA)
  })

  // Selos e avisos: texto colorido sobre a própria cor a 10% de opacidade, tanto sobre cartões quanto
  // sobre o fundo da página (linha de tabela em hover).
  const tons: [string, string][] = [
    ['status aberto', p.status.aberto],
    ['status em atendimento', p.status.emAtendimento],
    ['status concluído', p.status.concluido],
    ['primary', p.primary],
    ['secondary', p.secondary],
    ['success', p.success],
    ['warning', p.warning],
    ['danger', p.danger],
  ]
  it.each(tons)('selo "%s" sobre a própria tinta', (_nome2, cor) => {
    for (const fundo of [p.surface, p.background]) {
      expect(contraste(rgb(cor), tinta(rgb(cor), rgb(fundo)))).toBeGreaterThanOrEqual(MINIMO_AA)
    }
  })
})
