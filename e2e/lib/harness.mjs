// Utilitários compartilhados pelas suítes E2E: abre o Chrome, registra a rede e o console, e oferece
// os gestos comuns (entrar, sair, clicar por rótulo, preencher campo pelo <label>...).
import { mkdirSync, readFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import puppeteer from 'puppeteer-core'

// Configuração por variáveis de ambiente (os padrões servem ao ambiente de desenvolvimento local).
export const APP_URL = (process.env.APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')
// Endereço da API como o NAVEGADOR a enxerga (no Docker é "<app>/api", via nginx).
export const API_URL = (process.env.API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const CHROME_PATH = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const SAIDA = process.env.E2E_OUT ?? new URL('../resultados/', import.meta.url).pathname

const AXE_FONTE = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8')

export const pausa = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
export const diasAtras = (n) => new Date(Date.now() - n * 864e5).toISOString().slice(0, 10)

export async function iniciar(nomeDaSuite, { largura = 1100, altura = 800 } = {}) {
  mkdirSync(SAIDA, { recursive: true })
  const navegador = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: process.env.CI ? ['--no-sandbox', '--disable-dev-shm-usage'] : [],
  })
  const pagina = await navegador.newPage()
  await pagina.setViewport({ width: largura, height: altura })

  // ---- registro de console e rede ----
  const errosDeConsole = []
  pagina.on('console', (m) => m.type() === 'error' && errosDeConsole.push(m.text()))
  pagina.on('pageerror', (e) => errosDeConsole.push(String(e)))
  const rede = [] // { metodo, url, status } de toda resposta vinda da API
  pagina.on('response', (r) => {
    if (r.url().startsWith(API_URL)) rede.push({ metodo: r.request().method(), url: r.url().slice(API_URL.length), status: r.status() })
  })

  // Bloqueio de requisições à API para simular queda: ctx.bloqueio.quando = (url, metodo) => boolean
  const bloqueio = { ativo: false, quando: () => false }
  // Resposta simulada da API: ctx.simulacao.quando = (url, metodo) => ({ status, corpo }) | null. Serve para
  // reproduzir situações raras do servidor (ex.: dados que mudam entre o clique e a resposta).
  const simulacao = { quando: () => null }
  await pagina.setRequestInterception(true)
  pagina.on('request', (r) => {
    const ehApi = r.url().startsWith(API_URL)
    const rota = ehApi ? r.url().slice(API_URL.length) : ''
    if (ehApi && bloqueio.ativo && bloqueio.quando(rota, r.method())) return r.abort('failed')
    const falsa = ehApi ? simulacao.quando(rota, r.method()) : null
    if (falsa) {
      return r.respond({
        status: falsa.status ?? 200,
        contentType: 'application/json',
        // Necessário quando a API está em outra origem (desenvolvimento: 5173 → 3000).
        headers: { 'Access-Control-Allow-Origin': APP_URL, 'Access-Control-Allow-Credentials': 'true' },
        body: JSON.stringify(falsa.corpo),
      })
    }
    r.continue()
  })

  // ---- verificações ----
  let ok = 0
  let falhas = 0
  const checar = (nome, condicao, detalhe = '') => {
    condicao ? ok++ : falhas++
    console.log(`${condicao ? '✓' : '✗'} ${nome}${condicao ? '' : `  → ${detalhe}`}`)
  }

  // ---- leitura da página ----
  const esperar = (fn, arg) => pagina.waitForFunction(fn, { timeout: 8000 }, arg).catch(() => null)
  const texto = () => pagina.evaluate(() => document.body.innerText.replace(/\s+/g, ' '))
  const temTexto = async (trecho) => (await texto()).includes(trecho)
  const caminho = () => new URL(pagina.url()).pathname
  const linhasDaTabela = () =>
    pagina.evaluate(() => [...document.querySelectorAll('tbody tr')].map((tr) => [...tr.children].map((td) => td.innerText.trim())))
  const codigos = async () => (await linhasDaTabela()).map((l) => l[0])
  const opcoesDoSelect = () => pagina.evaluate(() => [...document.querySelectorAll('select option')].map((o) => o.textContent.trim()))

  // ---- gestos ----
  const clicar = (rotulo) =>
    pagina.evaluate((r) => {
      const el = [...document.querySelectorAll('button,a')].find((b) => b.textContent.trim() === r && !b.closest('dialog:not([open])'))
      if (!el) throw new Error(`Nenhum botão/link "${r}" visível`)
      el.click()
    }, rotulo)
  // Botões dentro de um <dialog> fechado não contam como existentes na tela.
  const temBotao = (rotulo) =>
    pagina.evaluate((r) => [...document.querySelectorAll('button,a')].some((b) => b.textContent.trim() === r && !b.closest('dialog:not([open])')), rotulo)
  const temTitulo = (rotulo) =>
    pagina.evaluate((r) => [...document.querySelectorAll('h1,h2,h3')].some((h) => h.textContent.trim() === r), rotulo)
  // Campo de formulário localizado pelo texto do <label> (como o usuário o enxerga).
  const campo = (rotulo) =>
    pagina.evaluateHandle((t) => {
      const label = [...document.querySelectorAll('label')].find((l) => l.textContent.includes(t))
      if (!label) throw new Error(`Nenhum campo com rótulo "${t}"`)
      return document.getElementById(label.htmlFor)
    }, rotulo)
  // Define a data de um <input type=date> SEM digitar: o que o campo aceita ao digitar depende do idioma do
  // navegador (DD/MM/AAAA em pt-BR, MM/DD/AAAA em en-US), mas o valor interno é sempre AAAA-MM-DD.
  // Usa o setter nativo + evento "input" para o React perceber a mudança.
  const preencherData = async (rotulo, iso) => {
    const input = await campo(rotulo)
    await input.evaluate((el, valor) => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, valor)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }, iso)
  }
  const ir = async (rota) => {
    await pagina.goto(APP_URL + rota, { waitUntil: 'networkidle0' })
    await pausa(300)
  }
  const entrar = async (usuario, senha = 'senha123') => {
    await pagina.goto('about:blank') // evita a corrida do Puppeteer ao navegar para a mesma URL em que já está
    await pagina.goto(`${APP_URL}/login`, { waitUntil: 'networkidle0' })
    await pagina.type('input[autocomplete=username]', usuario)
    await pagina.type('input[autocomplete=current-password]', senha)
    await pagina.click('button[type=submit]')
    await esperar(() => location.pathname !== '/login')
    await pausa(300)
  }
  const sair = async () => {
    await clicar('Sair')
    await esperar(() => location.pathname === '/login')
  }
  // Auditoria de acessibilidade com o axe-core (WCAG 2.x A/AA e boas práticas) na tela atual.
  // Devolve as violações encontradas, já resumidas: [{ regra, impacto, elementos: [...] }].
  const auditarAcessibilidade = async () => {
    await pagina.evaluate(AXE_FONTE) // injeta o axe na página
    const resultado = await pagina.evaluate(() =>
      // eslint-disable-next-line no-undef
      axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } }),
    )
    return resultado.violations.map((v) => ({
      regra: v.id,
      impacto: v.impact,
      ajuda: v.help,
      elementos: v.nodes.slice(0, 3).map((n) => `${n.target.join(' ')} → ${n.failureSummary?.split('\n')[1]?.trim() ?? ''}`),
    }))
  }
  // Verdadeiro se a página cabe na largura da janela (sem barra de rolagem horizontal).
  const semRolagemHorizontal = () =>
    pagina.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)
  // Sem nome de suíte, o arquivo fica só com o nome dado (usado pelo gerador de prints da documentação).
  const foto = (arquivo, opcoes = {}) => pagina.screenshot({ path: `${SAIDA}/${nomeDaSuite ? `${nomeDaSuite}-` : ''}${arquivo}.png`, ...opcoes })

  // Chama a API direto (sem navegador), autenticando como um dos usuários do seed. Serve para
  // provocar mudanças "por fora" (ex.: o atendente assume uma solicitação enquanto outra pessoa a vê).
  const apiComo = async (usuario, metodo, rota, corpo) => {
    const login = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, senha: 'senha123' }),
    })
    const cookie = login.headers.get('set-cookie')?.split(';')[0] ?? ''
    return fetch(API_URL + rota, {
      method: metodo,
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: corpo ? JSON.stringify(corpo) : undefined,
    })
  }

  const finalizar = async ({ ignorarErros = /Failed to load resource|net::|ERR_FAILED/ } = {}) => {
    const reais = errosDeConsole.filter((e) => !ignorarErros.test(e))
    checar('sem exceções de JavaScript no console', reais.length === 0, reais.join(' | '))
    console.log(`\n[${nomeDaSuite}] ${ok} ok, ${falhas} falha(s)`)
    await navegador.close()
    process.exit(falhas ? 1 : 0)
  }

  return {
    pagina, checar, finalizar, bloqueio, simulacao, rede, errosDeConsole,
    esperar, texto, temTexto, caminho, linhasDaTabela, codigos, opcoesDoSelect,
    clicar, temBotao, temTitulo, campo, preencherData, ir, entrar, sair, foto, apiComo, pausa, auditarAcessibilidade, semRolagemHorizontal,
  }
}
