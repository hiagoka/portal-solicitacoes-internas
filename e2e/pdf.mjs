// Gera o PDF do Memorial Técnico a partir do Markdown (docs/memorial-tecnico.md), com os diagramas renderizados.
//   cd e2e && npm run pdf        →  docs/memorial-tecnico.pdf
// Markdown → HTML (marked) → Chrome (puppeteer-core) → PDF. Os diagramas Mermaid são desenhados pelo Chrome a partir
// de um script carregado de uma CDN, então a geração precisa de internet; sem ela, o diagrama sai como texto.
import { readFileSync } from 'node:fs'
import { Marked } from 'marked'
import puppeteer from 'puppeteer-core'

const RAIZ = new URL('../', import.meta.url)
const ORIGEM = new URL('docs/memorial-tecnico.md', RAIZ)
const SAIDA = new URL('docs/memorial-tecnico.pdf', RAIZ).pathname
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const REPO = 'https://github.com/hiagoka/portal-solicitacoes-internas/blob/main/docs/memorial-tecnico.md'

const marked = new Marked({
  gfm: true,
  renderer: {
    // Links relativos (ex.: ../README.md, decisoes.md) viram links absolutos para o repositório: num PDF, um link relativo morre.
    link({ href, tokens }) {
      const texto = this.parser.parseInline(tokens)
      const destino = /^(https?:|#|mailto:)/.test(href) ? href : new URL(href, REPO).href
      return `<a href="${destino}">${texto}</a>`
    },
    // Blocos ```mermaid viram <div class="mermaid"> para o Mermaid desenhar.
    code({ text, lang }) {
      if (lang === 'mermaid') return `<div class="mermaid">${text}</div>`
      const escapado = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return `<pre><code>${escapado}</code></pre>`
    },
  },
})

const corpo = marked.parse(readFileSync(ORIGEM, 'utf8'))
const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Memorial Técnico de Desenvolvimento</title>
<style>
  @page { size: A4; margin: 18mm 16mm 18mm 16mm; }
  * { box-sizing: border-box; }
  body { font: 10.5pt/1.5 -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1a202c; margin: 0; }
  h1 { font-size: 21pt; line-height: 1.2; margin: 0 0 6mm; padding-bottom: 3mm; border-bottom: 3px solid #4f46e5; color: #111827; }
  h2 { font-size: 15pt; margin: 9mm 0 3mm; padding-bottom: 1.5mm; border-bottom: 1px solid #d1d5db; color: #1e1b4b; break-after: avoid; }
  h3 { font-size: 12pt; margin: 6mm 0 2mm; color: #312e81; break-after: avoid; }
  p, li { orphans: 3; widows: 3; }
  a { color: #4338ca; text-decoration: none; }
  code { font: 9pt ui-monospace, Menlo, Consolas, monospace; background: #eef2ff; padding: 0.3mm 1.2mm; border-radius: 2px; }
  pre { background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 4px; padding: 3mm; overflow: hidden; break-inside: avoid; white-space: pre-wrap; }
  pre code { background: none; padding: 0; font-size: 8.5pt; }
  table { border-collapse: collapse; width: 100%; margin: 3mm 0; font-size: 9pt; break-inside: auto; }
  th, td { border: 1px solid #d1d5db; padding: 1.6mm 2.2mm; text-align: left; vertical-align: top; }
  th { background: #eef2ff; color: #1e1b4b; }
  tr { break-inside: avoid; }
  blockquote { margin: 3mm 0; padding: 1mm 4mm; border-left: 3px solid #a5b4fc; background: #f8fafc; color: #374151; }
  hr { border: 0; border-top: 1px solid #d1d5db; margin: 6mm 0; }
  .mermaid { text-align: center; margin: 4mm 0; break-inside: avoid; }
  .mermaid svg { max-width: 100%; height: auto; }
  ul, ol { padding-left: 6mm; }
</style></head><body>${corpo}
<script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
<script>window.__mermaid = (async () => { try { mermaid.initialize({ startOnLoad: false, theme: 'neutral' }); await mermaid.run(); return 'ok' } catch (e) { return 'erro: ' + e.message } })()</script>
</body></html>`

const navegador = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: process.env.CI ? ['--no-sandbox'] : [] })
const pagina = await navegador.newPage()
await pagina.setContent(html, { waitUntil: 'networkidle0' })
const mermaid = await pagina.evaluate(() => (window.__mermaid ? window.__mermaid : 'sem mermaid'))
const desenhados = await pagina.$$eval('.mermaid svg', (s) => s.length)
console.log(`diagramas: ${desenhados} desenhado(s) (${mermaid})`)
await pagina.pdf({
  path: SAIDA, format: 'A4', printBackground: true, displayHeaderFooter: true,
  margin: { top: '18mm', bottom: '18mm', left: '16mm', right: '16mm' },
  headerTemplate: '<div></div>',
  footerTemplate: '<div style="width:100%;font-size:8px;color:#6b7280;padding:0 16mm;display:flex;justify-content:space-between"><span>Memorial Técnico de Desenvolvimento — Portal de Solicitações Internas</span><span><span class="pageNumber"></span> / <span class="totalPages"></span></span></div>',
})
await navegador.close()
console.log(`PDF gerado: ${SAIDA}`)
