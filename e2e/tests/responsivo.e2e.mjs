// Responsividade: celular (360 e 390 px) e tablet (768 px). Sem rolagem horizontal, cartões no lugar da tabela,
// filtros recolhíveis, alvos de toque confortáveis e um fluxo completo no celular.
import { iniciar, pausa } from '../lib/harness.mjs'

const t = await iniciar('responsivo', { largura: 390, altura: 844 })
const { pagina, checar, temTexto, caminho, esperar, clicar, ir, entrar, sair, campo, codigos, digitar } = t

const viewport = (largura, altura) => pagina.setViewport({ width: largura, height: altura, isMobile: largura < 700, hasTouch: largura < 700 })
// Elemento existe E está visível (não é display:none nem tem tamanho zero).
const visivel = (seletor) =>
  pagina.evaluate((s) => { const el = document.querySelector(s); return !!el && getComputedStyle(el).display !== 'none' && el.getClientRects().length > 0 }, seletor)
const alturaDe = (rotulo, seletor = 'button,a') =>
  pagina.evaluate((r, s) => { const el = [...document.querySelectorAll(s)].find((b) => b.textContent.trim() === r && b.getClientRects().length > 0); return el ? Math.round(el.getBoundingClientRect().height) : 0 }, rotulo, seletor)
const retangulo = (seletor) => pagina.evaluate((s) => { const r = document.querySelector(s)?.getBoundingClientRect(); return r ? { x: r.x, y: r.y, w: r.width, h: r.height, b: r.bottom, r: r.right } : null }, seletor)
const cabeNaTela = async (nome) => checar(`${nome}: sem rolagem horizontal`, await t.semRolagemHorizontal())

// =================== CELULAR 390 ===================
await viewport(390, 844)
await entrar('maria')
await esperar(() => document.querySelector('p.text-4xl'))
await cabeNaTela('390 dashboard')
await t.foto('celular-dashboard')

// cabeçalho
const marca = await retangulo('header a')
const nav = await retangulo('header nav')
const sairBtn = await pagina.evaluate(() => { const b = [...document.querySelectorAll('header button')].find((x) => x.textContent.trim() === 'Sair'); const r = b.getBoundingClientRect(); return { dentro: r.right <= window.innerWidth && r.left >= 0, h: Math.round(r.height) } })
checar('390 cabeçalho: navegação fica abaixo da marca', nav.y >= marca.b - 1, JSON.stringify({ marca, nav }))
checar('390 cabeçalho: "Sair" visível dentro da tela', sairBtn.dentro)
checar('390 cabeçalho: perfil aparece (o nome fica oculto)', (await temTexto('Solicitante')) && !(await visivel('header .hidden.sm\\:flex')))
const tema = await pagina.evaluate(() => { const b = document.querySelector('button[aria-label^="Mudar para o tema"]'); const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), icone: Math.round(b.querySelector('svg').getBoundingClientRect().width) } })
checar('390 botão de tema: quadrado de 40px com o ícone em tamanho real (20px)', tema.w === 40 && tema.h === 40 && tema.icone === 20, JSON.stringify(tema))
checar('390 alvos de toque do cabeçalho ≥ 40px', sairBtn.h >= 40 && (await alturaDe('Dashboard')) >= 40 && (await alturaDe('Solicitações')) >= 40, `Sair=${sairBtn.h} Dashboard=${await alturaDe('Dashboard')}`)

// listagem em cartões
await ir('/solicitacoes')
await esperar(() => document.querySelector('ul[aria-label="Solicitações"] li'))
await cabeNaTela('390 listagem')
checar('390 listagem: cartões visíveis e tabela oculta', (await visivel('ul[aria-label="Solicitações"]')) && !(await visivel('table')))
checar('390 listagem: 5 cartões da Maria', (await pagina.$$('ul[aria-label="Solicitações"] li')).length === 5)
const card = await pagina.evaluate(() => document.querySelector('ul[aria-label="Solicitações"] li').innerText.replace(/\s+/g, ' '))
checar('390 cartão: código, status, título, categoria, solicitante e data', /#0001/.test(card) && /Aberto/.test(card) && /Notebook não liga/.test(card) && /TI/.test(card) && /Maria Souza/.test(card) && /\d{2}\/\d{2}\/\d{4}/.test(card), card)
await t.foto('celular-lista')

// filtros recolhíveis
checar('390 filtros: só a busca aparece; os demais ficam recolhidos', (await visivel('input[type=search]')) && !(await visivel('select')) && (await temTexto('Mais filtros')))
await clicar('Mais filtros'); await pausa(200)
checar('390 filtros: "Mais filtros" abre o painel', (await visivel('select')) && (await temTexto('Ocultar filtros')))
await (await campo('Status')).select('aberto'); await pausa(700)
checar('390 filtros: contador de filtros ativos no botão', await pagina.evaluate(() => [...document.querySelectorAll('button')].find((b) => b.textContent.includes('Ocultar filtros'))?.textContent.includes('1')))
checar('390 filtros: aplicar filtra os cartões (2 abertas)', (await pagina.$$('ul[aria-label="Solicitações"] li')).length === 2)
await cabeNaTela('390 listagem com filtros abertos')
await clicar('Limpar filtros'); await pausa(600)

// rodapé de paginação
const rodape = await retangulo('nav[aria-label="Paginação"]')
checar('390 paginação cabe na tela e tem botões ≥ 40px', rodape.r <= 390 && (await alturaDe('Próxima')) >= 40 && (await alturaDe('Anterior')) >= 40, JSON.stringify(rodape))

// abrir detalhes pelo cartão
await pagina.evaluate(() => [...document.querySelectorAll('ul[aria-label="Solicitações"] a')].find((a) => a.textContent === 'Notebook não liga').click())
await esperar(() => location.pathname === '/solicitacoes/1')
await esperar(() => document.body.innerText.includes('Descrição'))
await cabeNaTela('390 detalhes')
checar('390 detalhes: Editar e Excluir acessíveis e ≥ 40px', (await alturaDe('Editar')) >= 40 && (await alturaDe('Excluir')) >= 40)
await t.foto('celular-detalhes')

// modal
await clicar('Excluir'); await pausa(300)
const modal = await retangulo('dialog[open]')
checar('390 modal cabe na tela com margem', modal && modal.x >= 8 && modal.r <= 382, JSON.stringify(modal))
await t.foto('celular-modal')
await pagina.keyboard.press('Escape'); await pausa(200)

// formulário
await ir('/solicitacoes/nova')
await cabeNaTela('390 formulário')
const btnCriar = await pagina.evaluate(() => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim() === 'Criar solicitação'); const r = b.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) } })
const form = await retangulo('form')
checar('390 formulário: botão de enviar ocupa a largura toda e é alto o bastante', btnCriar.w >= form.w - 2 && btnCriar.h >= 40, JSON.stringify({ btnCriar, form: form.w }))
await t.foto('celular-formulario')

// ---- fluxo completo no celular: criar e excluir
await digitar(await campo('Título'), 'Criada no celular')
await (await campo('Categoria')).select('RH')
await digitar(await campo('Descrição'), 'Fluxo completo em tela pequena')
await clicar('Criar solicitação')
await esperar(() => /\/solicitacoes\/\d+$/.test(location.pathname))
await esperar(() => document.body.innerText.includes('Criada no celular'))
checar('390 fluxo: criar pelo celular abre os detalhes da nova solicitação', (await temTexto('Criada no celular')) && (await temTexto('Recursos Humanos') || (await temTexto('RH'))))
await cabeNaTela('390 detalhes da nova solicitação')
await clicar('Excluir'); await pausa(300)
await pagina.evaluate(() => [...document.querySelectorAll('dialog button')].find((b) => b.textContent.trim() === 'Excluir').click())
await esperar(() => location.pathname === '/solicitacoes')
await pausa(600)
checar('390 fluxo: excluir pelo celular volta à lista sem a solicitação', caminho() === '/solicitacoes' && !(await temTexto('Criada no celular')))
await sair()

// ---- login e 404 no celular
await ir('/login')
await cabeNaTela('390 login')
const cartaoLogin = await retangulo('main > div, main form')
checar('390 login: formulário dentro da tela', cartaoLogin.r <= 390)
await t.foto('celular-login')
await entrar('atendente')
await ir('/nao-existe')
await cabeNaTela('390 página não encontrada')

// =================== CELULAR PEQUENO 360 ===================
await viewport(360, 740)
for (const rota of ['/', '/solicitacoes', '/solicitacoes/4', '/solicitacoes/nova']) {
  await ir(rota)
  await pausa(500)
  await cabeNaTela(`360 ${rota}`)
}
await t.foto('celular-pequeno-detalhes-atendente')

// =================== TABLET 768 ===================
await viewport(768, 1024)
await ir('/solicitacoes')
await esperar(() => document.querySelector('tbody tr'))
await cabeNaTela('768 listagem')
checar('768 listagem: tabela visível e cartões ocultos', (await visivel('table')) && !(await visivel('ul[aria-label="Solicitações"]')))
checar('768 filtros: painel sempre aberto, sem botão "Mais filtros"', (await visivel('select')) && !(await temTexto('Mais filtros')))
checar('768 tabela mostra as 10 do atendente', (await codigos()).length === 10)
checar('768 cabeçalho: nome do usuário visível', await temTexto('Ana Atendente'))
await ir('/')
await esperar(() => document.querySelector('p.text-4xl'))
await cabeNaTela('768 dashboard')
await ir('/solicitacoes/4')
await esperar(() => document.body.innerText.includes('Alterar status para'))
await cabeNaTela('768 detalhes')
await t.foto('tablet-detalhes')

await t.finalizar({ ignorarErros: /Failed to load resource|404|net::/ })
