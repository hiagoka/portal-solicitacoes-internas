// Garante a regra do projeto: nenhuma cor fora de src/styles/theme.ts.
// Falha (exit 1) se encontrar #hex, rgb()/hsl() ou classes da paleta padrão do Tailwind (bg-blue-500, text-white...).
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

const RAIZ = new URL('..', import.meta.url).pathname
const PERMITIDO = 'src/styles/theme.ts'
const EXTENSOES = ['.ts', '.tsx', '.css', '.html']

const cores = 'slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose'
const prefixos = 'bg|text|border|ring|fill|stroke|from|via|to|divide|outline|decoration|accent|caret|shadow|placeholder'

const REGRAS = [
  { nome: 'cor hexadecimal', regex: /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g },
  { nome: 'rgb()/hsl()/oklch() solto', regex: /\b(?:rgba?|hsla?|oklch|oklab)\(/g },
  { nome: 'cor da paleta padrão do Tailwind', regex: new RegExp(`\\b(?:${prefixos})-(?:${cores})-\\d{2,3}\\b`, 'g') },
  { nome: 'bg-white / text-black etc.', regex: new RegExp(`\\b(?:${prefixos})-(?:white|black)\\b`, 'g') },
  { nome: 'valor arbitrário de cor', regex: new RegExp(`\\b(?:${prefixos})-\\[(?:#|rgb|hsl)`, 'g') },
]

function arquivos(dir) {
  return readdirSync(dir).flatMap((nome) => {
    const caminho = join(dir, nome)
    if (statSync(caminho).isDirectory()) return arquivos(caminho)
    return EXTENSOES.some((e) => nome.endsWith(e)) ? [caminho] : []
  })
}

const alvos = [...arquivos(join(RAIZ, 'src')), join(RAIZ, 'index.html')]
const problemas = []

for (const arquivo of alvos) {
  const rel = relative(RAIZ, arquivo)
  if (rel === PERMITIDO) continue
  readFileSync(arquivo, 'utf8').split('\n').forEach((linha, i) => {
    for (const { nome, regex } of REGRAS) {
      for (const m of linha.matchAll(regex)) problemas.push(`${rel}:${i + 1}  ${nome}: ${m[0]}`)
    }
  })
}

if (problemas.length) {
  console.error(`✗ ${problemas.length} cor(es) fora do tema:\n  ` + problemas.join('\n  '))
  console.error(`\nUse apenas os nomes semânticos definidos em ${PERMITIDO} (bg-surface, text-textMuted...).`)
  process.exit(1)
}
console.log(`✓ Nenhuma cor solta em ${alvos.length} arquivos.`)
