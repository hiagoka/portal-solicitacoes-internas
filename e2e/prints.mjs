// Gera as imagens da documentação (docs/prints) percorrendo o sistema real em um navegador.
//   APP_URL=http://localhost:8080 API_URL=http://localhost:8080/api E2E_OUT=../docs/prints node prints.mjs
// Parte do banco no estado de demonstração (seed) e não grava nada que permaneça.
import { iniciar, pausa } from './lib/harness.mjs'

const t = await iniciar('', { largura: 1280, altura: 800 })
const { pagina, esperar, clicar, ir, entrar, sair, campo, texto, foto, digitar } = t

const tema = async (modo) => {
  await pagina.evaluate((m) => { localStorage.setItem('tema', m); document.documentElement.classList.toggle('dark', m === 'dark') }, modo)
  await pausa(200)
}
const desktop = () => pagina.setViewport({ width: 1280, height: 800 })
const celular = () => pagina.setViewport({ width: 390, height: 844, isMobile: true, hasTouch: true })
const selecionar = async (rotulo, valor) => { await (await campo(rotulo)).select(valor); await pausa(700) }

// 01 — login
await ir('/login'); await tema('light')
await foto('01-login')
await digitar('input[autocomplete=username]', 'maria')
await digitar('input[autocomplete=current-password]', 'senha-errada')
await pagina.click('button[type=submit]')
await esperar(() => document.querySelector('[role=alert]'))
await foto('02-login-erro-de-credenciais')

// 03 — dashboard do solicitante
await entrar('maria'); await esperar(() => document.querySelector('p.text-4xl'))
await foto('03-dashboard-solicitante')

// 04, 05 — listagem do solicitante e filtros
await ir('/solicitacoes'); await esperar(() => document.querySelector('tbody tr'))
await foto('04-listagem-solicitante')
await selecionar('Status', 'aberto')
await digitar(await campo('Buscar pelo título'), 'nota'); await pausa(1000)
await foto('05-listagem-com-filtros')

// 06 — formulário com erros de validação, 07 — preenchido
await ir('/solicitacoes/nova')
await clicar('Criar solicitação'); await pausa(300)
await foto('06-formulario-com-erros-de-validacao')
await digitar(await campo('Título'), 'Troca de monitor do setor financeiro')
await (await campo('Categoria')).select('Compras')
await digitar(await campo('Descrição'), 'O monitor atual apresenta falhas na imagem. Solicito a substituição por um modelo de 24 polegadas.')
await foto('07-formulario-preenchido')

// 08, 09 — detalhes do autor e modal de exclusão
await ir('/solicitacoes/1'); await esperar(() => document.body.innerText.includes('Notebook não liga'))
await foto('08-detalhes-do-autor')
await clicar('Excluir'); await pausa(400)
await foto('09-confirmacao-de-exclusao')
await pagina.keyboard.press('Escape'); await pausa(200)

// 21 — histórico de status (solicitação concluída: três eventos)
await ir('/solicitacoes/3'); await esperar(() => document.querySelectorAll('ol[aria-label="Histórico de status"] li').length === 3)
await foto('21-historico-de-status', { fullPage: true })

// 10 — solicitação em atendimento (sem editar/excluir)
await ir('/solicitacoes/2'); await esperar(() => document.body.innerText.includes('Acesso ao sistema'))
await foto('10-solicitacao-em-atendimento-somente-leitura')
await sair()

// 11..14 — atendente
await entrar('atendente'); await esperar(() => document.querySelector('p.text-4xl'))
await foto('11-dashboard-atendente')
await ir('/solicitacoes'); await esperar(() => document.querySelector('tbody tr'))
await foto('12-listagem-atendente')
await selecionar('Por página', '5')
await foto('13-listagem-paginada')
await ir('/solicitacoes/4'); await esperar(() => document.body.innerText.includes('Alterar status para'))
await (await campo('Alterar status para')).select('em_atendimento'); await pausa(200)
await foto('14-atendente-alterando-status')

// 15, 16 — tema escuro
await ir('/'); await esperar(() => document.querySelector('p.text-4xl')); await tema('dark')
await foto('15-dashboard-tema-escuro')
await ir('/solicitacoes'); await esperar(() => document.querySelector('tbody tr'))
await foto('16-listagem-tema-escuro')

// 17..20 — celular
await celular(); await tema('light')
await ir('/solicitacoes'); await esperar(() => document.querySelector('ul[aria-label="Solicitações"] li'))
await foto('17-celular-listagem-em-cartoes')
await clicar('Mais filtros'); await pausa(300)
await foto('18-celular-filtros-abertos')
await ir('/solicitacoes/4'); await esperar(() => document.body.innerText.includes('Alterar status para'))
await foto('19-celular-detalhes-do-atendente')
await tema('dark'); await ir('/')
await esperar(() => document.querySelector('p.text-4xl'))
await foto('20-celular-dashboard-tema-escuro')

console.log(`texto da última tela: ${(await texto()).slice(0, 60)}…`)
await t.finalizar()
