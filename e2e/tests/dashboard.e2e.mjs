// Dashboard: indicadores por perfil, atualização, navegação, estado de erro e estado vazio.
import { iniciar, pausa } from '../lib/harness.mjs'

const t = await iniciar('dashboard', { largura: 1100, altura: 800 })
const { pagina, checar, texto, caminho, esperar, clicar, entrar, sair, apiComo } = t

// lê os 4 cartões: [{ rotulo, valor }]
const cartoes = () =>
  pagina.evaluate(() =>
    [...document.querySelectorAll('p.text-4xl')].map((p) => ({
      valor: Number(p.textContent.replace(/\./g, '')),
      rotulo: p.previousElementSibling.textContent.trim(),
    })),
  )
const valores = async () => JSON.stringify((await cartoes()).map((c) => c.valor))
async function abrirDashboard(usuario) {
  await entrar(usuario)
  await esperar(() => document.querySelector('p.text-4xl') || document.body.innerText.includes('Não foi possível'))
}

// ---- Maria
await abrirDashboard('maria')
let tela = await texto()
checar('1 Maria: total 5, abertas 2, em atendimento 1, concluídas 2', (await valores()) === '[5,2,1,2]', await valores())
checar('1 rótulos dos cartões', JSON.stringify((await cartoes()).map((c) => c.rotulo)) === JSON.stringify(['Total de solicitações', 'Aberto', 'Em Atendimento', 'Concluído']))
checar('1 subtítulo do solicitante', tela.includes('Resumo das suas solicitações.'))
checar('1 legenda com quantidade e porcentagem', tela.includes('Aberto: 2 (40%)') && tela.includes('Em Atendimento: 1 (20%)') && tela.includes('Concluído: 2 (40%)'), tela)
const aria = await pagina.$eval('[role=img]', (el) => el.getAttribute('aria-label'))
checar('1 barra tem descrição para leitor de tela', aria === 'Aberto: 2 (40%), Em Atendimento: 1 (20%), Concluído: 2 (40%)', aria)
const larguras = await pagina.$$eval('[role=img] > div', (els) => els.map((e) => Math.round((e.getBoundingClientRect().width / e.parentElement.getBoundingClientRect().width) * 100)))
checar('1 segmentos da barra proporcionais (40/20/40)', JSON.stringify(larguras) === '[40,20,40]', JSON.stringify(larguras))
await pagina.evaluate(() => { localStorage.setItem('tema', 'dark'); document.documentElement.classList.add('dark') })
await t.foto('escuro')
await pagina.evaluate(() => { localStorage.setItem('tema', 'light'); document.documentElement.classList.remove('dark') })
await pausa(200)
await t.foto('claro')

// ---- atualiza após mudança (criar via API e recarregar)
const criada = await (await apiComo('maria', 'POST', '/solicitacoes', { titulo: 'Dash E2E', descricao: 'x', categoria: 'TI' })).json()
await pagina.reload({ waitUntil: 'networkidle0' })
await esperar(() => document.querySelector('p.text-4xl'))
const c = await cartoes()
checar('2 após criar, total e abertas aumentam', c[0].valor === 6 && c[1].valor === 3, JSON.stringify(c))
await apiComo('maria', 'DELETE', `/solicitacoes/${criada.solicitacao.id}`)

// ---- navegação
await clicar('Ver solicitações')
await esperar(() => location.pathname === '/solicitacoes')
checar('3 "Ver solicitações" leva à listagem', caminho() === '/solicitacoes')
await sair()

// ---- atendente
await abrirDashboard('atendente')
tela = await texto()
checar('4 atendente: 10 / 4 / 3 / 3', (await valores()) === '[10,4,3,3]', await valores())
checar('4 subtítulo do atendente', tela.includes('Visão geral de todas as solicitações.'))

// ---- erro + tentar novamente
t.bloqueio.quando = (url) => url === '/dashboard'
t.bloqueio.ativo = true
await pagina.reload({ waitUntil: 'networkidle0' })
await esperar(() => document.body.innerText.includes('Não foi possível carregar'))
checar('5 falha na API: estado de erro com botão', (await texto()).includes('Não foi possível carregar') && (await texto()).includes('Tentar novamente'))
t.bloqueio.ativo = false
await clicar('Tentar novamente')
await esperar(() => document.querySelector('p.text-4xl'))
checar('5 tentar novamente recupera os indicadores', (await valores()) === '[10,4,3,3]')
await sair()

// ---- usuário sem solicitações (criado pelo run.sh)
await abrirDashboard('vazio')
tela = await texto()
checar('6 usuário sem solicitações: zeros', (await valores()) === '[0,0,0,0]', `${await valores()} url=${caminho()}`)
checar('6 mensagem de estado vazio no lugar da barra', tela.includes('Ainda não há solicitações para exibir.') && !(await pagina.$('[role=img]')))

await t.finalizar({ ignorarErros: /Failed to load resource|net::|ERR_FAILED|401/ })
