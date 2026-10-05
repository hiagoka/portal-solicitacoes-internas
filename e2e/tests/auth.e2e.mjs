// Autenticação: login, sessão, logout, rotas protegidas, tema e redirecionamento ao destino pedido.
import { iniciar } from '../lib/harness.mjs'

const t = await iniciar('auth', { largura: 1100, altura: 700 })
const { pagina, checar, texto, temTexto, caminho, esperar, clicar, ir, entrar, sair } = t

// 1. rota protegida sem login
await ir('/')
checar('1 sem login, "/" redireciona para /login', caminho() === '/login', caminho())

// 2. campos vazios
await pagina.click('button[type=submit]')
await esperar(() => document.querySelector('[role=alert]'))
checar('2 envio vazio mostra validação', (await texto()).includes('Informe o usuário e a senha.'))

// 3. senha errada
await pagina.type('input[autocomplete=username]', 'maria')
await pagina.type('input[autocomplete=current-password]', 'errada')
await pagina.click('button[type=submit]')
await esperar(() => document.body.innerText.includes('Usuário ou senha inválidos'))
checar('3 senha errada mostra a mensagem da API e continua no login', (await texto()).includes('Usuário ou senha inválidos') && caminho() === '/login')
await t.foto('login-erro')

// 4. login correto
await entrar('maria')
await esperar(() => document.body.innerText.includes('Olá, Maria Souza'))
const tela = await texto()
checar('4 login leva ao dashboard', caminho() === '/')
checar('4 mostra nome e perfil no cabeçalho', tela.includes('Maria Souza') && tela.includes('Solicitante'))
checar('4 saudação personalizada', tela.includes('Olá, Maria Souza'))

// 5. recarregar mantém a sessão
await pagina.reload({ waitUntil: 'networkidle0' })
checar('5 recarregar mantém logado', caminho() === '/' && (await texto()).includes('Olá, Maria Souza'))

// 6. /login estando logado
await ir('/login')
checar('6 /login estando logado volta ao dashboard', caminho() === '/', caminho())

// 7. rota inexistente
await ir('/nao-existe')
checar('7 rota desconhecida mostra "Página não encontrada"', (await texto()).includes('Página não encontrada'))

// 8. tema
await pagina.click('button[aria-label^="Mudar para o tema"]')
const escuro = await pagina.evaluate(() => document.documentElement.classList.contains('dark'))
const salvo = await pagina.evaluate(() => localStorage.getItem('tema'))
checar('8 botão alterna o tema e salva a preferência', salvo === (escuro ? 'dark' : 'light'), `${escuro} ${salvo}`)
await pagina.reload({ waitUntil: 'networkidle0' })
checar('8 tema persiste após recarregar', (await pagina.evaluate(() => document.documentElement.classList.contains('dark'))) === escuro)

// 9. logout
await sair()
checar('9 sair leva ao login', caminho() === '/login')
await ir('/')
checar('9 após sair, "/" exige login de novo', caminho() === '/login')

// 10. deep link volta ao destino original após login
await ir('/rota-protegida-x')
checar('10 deep link sem login vai ao login', caminho() === '/login')
await pagina.type('input[autocomplete=username]', 'atendente')
await pagina.type('input[autocomplete=current-password]', 'senha123')
await pagina.click('button[type=submit]')
await esperar(() => location.pathname === '/rota-protegida-x')
checar('10 após o login volta à rota pedida', caminho() === '/rota-protegida-x', caminho())
checar('10 atendente vê o perfil correto', (await texto()).includes('Atendente'))

// 11. sair voluntariamente NÃO deixa o próximo usuário herdar a tela de quem saiu
await ir('/solicitacoes')
await sair()
await entrar('joao')
checar('11 depois de "Sair", o próximo login cai no dashboard (e não na tela anterior)', caminho() === '/', caminho())

// 12. "Sair" com a API fora do ar: não finge que saiu (o cookie continua válido no servidor)
t.bloqueio.quando = (rota, metodo) => metodo === 'POST' && rota === '/auth/logout'
t.bloqueio.ativo = true
await clicar('Sair')
await esperar(() => document.body.innerText.includes('Não foi possível encerrar a sessão'))
checar('12 logout falho: avisa o erro e continua logado (sem fingir que saiu)', (await temTexto('Não foi possível encerrar a sessão')) && caminho() === '/' && (await temTexto('Sair')))
await pagina.reload({ waitUntil: 'networkidle0' })
checar('12 logout falho: a sessão realmente continua válida após recarregar', caminho() === '/' && (await temTexto('Olá, João Lima')))
t.bloqueio.ativo = false
await sair()
checar('12 com a API de volta, "Sair" funciona', caminho() === '/login')

await t.finalizar({ ignorarErros: /401|Failed to load resource|net::|ERR_FAILED/ })
