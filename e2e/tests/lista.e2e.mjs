// Listagem: escopo por perfil, filtros, debounce, período inválido, estados vazio/erro.
import { diasAtras, iniciar, pausa } from '../lib/harness.mjs'

const t = await iniciar('lista', { largura: 1200, altura: 900 })
const { pagina, checar, texto, temTexto, caminho, esperar, clicar, ir, entrar, sair, campo, preencherData, codigos, linhasDaTabela, rede } = t

async function irParaLista() {
  await ir('/solicitacoes')
  await esperar(() => document.querySelector('tbody tr'))
}
async function escolher(rotulo, valor) {
  await (await campo(rotulo)).select(valor)
  await pausa(600)
}
// Quantas vezes a LISTA foi buscada (GET /solicitacoes, com ou sem query string).
const listagens = () => rede.filter((r) => r.metodo === 'GET' && /^\/solicitacoes(\?|$)/.test(r.url)).length

// ---------- solicitante (maria) ----------
await entrar('maria')
await irParaLista()
let tela = await texto()
checar('1 título e contagem do solicitante', tela.includes('Minhas solicitações') && tela.includes('5 solicitações'))
checar('1 só as da Maria, mais recentes primeiro', JSON.stringify(await codigos()) === JSON.stringify(['#0001', '#0002', '#0009', '#0003', '#0008']), JSON.stringify(await codigos()))
const l1 = (await linhasDaTabela())[0]
checar('2 colunas: título, categoria, solicitante, data dd/mm/aaaa, status', l1[1] === 'Notebook não liga' && l1[2] === 'TI' && l1[3] === 'Maria Souza' && /^\d{2}\/\d{2}\/\d{4}$/.test(l1[4]) && l1[5] === 'Aberto', JSON.stringify(l1))
await t.foto('claro')

await escolher('Status', 'aberto')
checar('3 filtro por status', JSON.stringify(await codigos()) === JSON.stringify(['#0001', '#0009']), JSON.stringify(await codigos()))
checar('3 aparece "Limpar filtros"', await temTexto('Limpar filtros'))
await escolher('Categoria', 'TI')
checar('3 status + categoria combinados', JSON.stringify(await codigos()) === JSON.stringify(['#0001']), JSON.stringify(await codigos()))
await clicar('Limpar filtros'); await pausa(600)
checar('4 limpar volta a 5 linhas e some o botão', (await codigos()).length === 5 && !(await temTexto('Limpar filtros')))

// debounce
const antes = listagens()
const busca = await campo('Buscar pelo título')
await busca.type('nota', { delay: 40 })
await pausa(1000)
checar('5 busca por texto filtra o título', JSON.stringify(await codigos()) === JSON.stringify(['#0009']), JSON.stringify(await codigos()))
checar('5 debounce: digitar 4 letras faz no máximo 1 requisição', listagens() - antes <= 1, `chamadas=${listagens() - antes}`)
await busca.click({ clickCount: 3 })
await busca.type('zzzz-nao-existe')
await pausa(1000)
tela = await texto()
checar('6 sem resultado com filtro: mensagem + limpar', tela.includes('Nenhuma solicitação encontrada') && tela.includes('Limpar filtros'))
await t.foto('vazio')
await clicar('Limpar filtros'); await pausa(600)

// período
await preencherData('a partir de', diasAtras(7))
await pausa(800)
checar('7 período "a partir de" 7 dias atrás', JSON.stringify(await codigos()) === JSON.stringify(['#0001', '#0002']), JSON.stringify(await codigos()))
const respostas400 = () => rede.filter((r) => r.status === 400).length
const antes400 = respostas400()
await preencherData('Aberta até', diasAtras(20))
await pausa(800)
checar('8 período invertido mostra aviso no campo', await temTexto('A data inicial não pode ser maior que a final.'))
checar('8 e nenhuma requisição inválida (400) é enviada', respostas400() === antes400, `400s=${respostas400() - antes400}`)

// ---------- clique no título ----------
await clicar('Limpar filtros'); await pausa(600)
await pagina.evaluate(() => [...document.querySelectorAll('tbody a')].find((a) => a.textContent === 'Notebook não liga').click())
await esperar(() => location.pathname === '/solicitacoes/1')
checar('9 clicar no título vai para /solicitacoes/1', caminho() === '/solicitacoes/1', caminho())

// ---------- erro de rede e tentar novamente ----------
await irParaLista()
t.bloqueio.quando = (url, metodo) => metodo === 'GET' && url.startsWith('/solicitacoes')
t.bloqueio.ativo = true
await escolher('Status', 'concluido')
await esperar(() => document.body.innerText.includes('Não foi possível carregar'))
checar('10 falha na API mostra estado de erro com "Tentar novamente"', (await temTexto('Não foi possível carregar')) && (await temTexto('Tentar novamente')))
t.bloqueio.ativo = false
await clicar('Tentar novamente'); await pausa(900)
checar('10 ao tentar novamente a lista volta', JSON.stringify(await codigos()) === JSON.stringify(['#0003', '#0008']), JSON.stringify(await codigos()))
await sair()

// ---------- atendente ----------
await entrar('atendente')
await irParaLista()
tela = await texto()
checar('11 atendente vê "Todas as solicitações" e 10 linhas', tela.includes('Todas as solicitações') && (await codigos()).length === 10 && tela.includes('10 solicitações'))
const linhas = await linhasDaTabela()
checar('11 atendente vê solicitantes variados', linhas.some((l) => l[3] === 'João Lima') && linhas.some((l) => l[3] === 'Maria Souza'))
await pagina.evaluate(() => { localStorage.setItem('tema', 'dark'); document.documentElement.classList.add('dark') })
await t.foto('escuro')

// ---------- paginação (atendente: 10 no seed; 5 por página → 2 páginas) ----------
const rotuloPagina = () => pagina.evaluate(() => document.querySelector('nav[aria-label="Paginação"] span')?.textContent?.trim() ?? '')
const botaoDesabilitado = (rotulo) =>
  pagina.evaluate((r) => [...document.querySelectorAll('nav[aria-label="Paginação"] button')].find((b) => b.textContent.trim() === r)?.disabled, rotulo)
checar('12 por padrão: 10 por página, tudo numa página só', (await rotuloPagina()) === 'Página 1 de 1' && (await temTexto('Mostrando 1–10 de 10')))
await escolher('Por página', '5')
checar('12 com 5 por página: 5 linhas e "Página 1 de 2"', JSON.stringify(await codigos()) === JSON.stringify(['#0006', '#0001', '#0004', '#0002', '#0005']) && (await rotuloPagina()) === 'Página 1 de 2', `${JSON.stringify(await codigos())} ${await rotuloPagina()}`)
checar('12 faixa exibida e botão "Anterior" desabilitado na primeira página', (await temTexto('Mostrando 1–5 de 10')) && (await botaoDesabilitado('Anterior')) === true && (await botaoDesabilitado('Próxima')) === false)
await clicar('Próxima'); await pausa(800)
checar('13 "Próxima" mostra os 5 mais antigos, sem repetir nenhum', JSON.stringify(await codigos()) === JSON.stringify(['#0010', '#0009', '#0003', '#0008', '#0007']), JSON.stringify(await codigos()))
checar('13 última página: "Próxima" desabilitada e faixa 6–10', (await rotuloPagina()) === 'Página 2 de 2' && (await botaoDesabilitado('Próxima')) === true && (await temTexto('Mostrando 6–10 de 10')))
await t.foto('paginacao')
await escolher('Status', 'concluido')
checar('14 mudar um filtro volta à primeira página', JSON.stringify(await codigos()) === JSON.stringify(['#0003', '#0008', '#0007']) && (await rotuloPagina()) === 'Página 1 de 1', `${JSON.stringify(await codigos())} ${await rotuloPagina()}`)
await clicar('Limpar filtros'); await pausa(700)
await clicar('Próxima'); await pausa(700)
await escolher('Por página', '10')
checar('14 mudar o tamanho da página também volta ao início', (await rotuloPagina()) === 'Página 1 de 1' && (await codigos()).length === 10)

// A página pedida deixa de existir (outra pessoa excluiu itens entre o clique e a resposta). Pela interface esse caso
// quase não é alcançável (a API passa a informar 1 página e "Próxima" fica desabilitada), então simulamos a resposta.
await escolher('Por página', '5')
t.simulacao.quando = (url) =>
  /pagina=2/.test(url) && url.startsWith('/solicitacoes')
    ? { corpo: { solicitacoes: [], paginacao: { pagina: 2, porPagina: 5, total: 10, totalPaginas: 1 } } }
    : null
await clicar('Próxima'); await pausa(900)
tela = await texto()
checar('15 página inexistente: aviso claro em vez de tabela vazia', tela.includes('Esta página não existe mais') && tela.includes('Ir para a última página'), tela.slice(0, 200))
t.simulacao.quando = () => null
await clicar('Ir para a última página'); await pausa(900)
checar('15 "Ir para a última página" recupera a lista', (await codigos()).length === 5 && (await rotuloPagina()).startsWith('Página 1 de'), `${(await codigos()).length} ${await rotuloPagina()}`)

await t.finalizar()
