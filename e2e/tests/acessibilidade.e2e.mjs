// Acessibilidade: auditoria automática (axe-core, WCAG 2.2 AA + boas práticas) de cada tela, nos dois temas.
import { iniciar, pausa } from '../lib/harness.mjs'

const t = await iniciar('acessibilidade', { largura: 1100, altura: 800 })
const { pagina, checar, esperar, clicar, ir, entrar, sair, auditarAcessibilidade } = t

async function definirTema(tema) {
  await pagina.evaluate((x) => {
    localStorage.setItem('tema', x)
    document.documentElement.classList.toggle('dark', x === 'dark')
  }, tema)
  await pausa(150)
}

// Audita a tela atual e registra o resultado. Em caso de falha, mostra a regra e os elementos afetados.
async function auditar(nome) {
  const violacoes = await auditarAcessibilidade()
  const detalhe = violacoes.map((v) => `${v.regra} [${v.impacto}] ${v.elementos.join(' | ')}`).join(' ;; ')
  checar(nome, violacoes.length === 0, detalhe)
}

// Audita a mesma tela nos dois temas (o contraste é diferente em cada um).
async function auditarNosDoisTemas(nome) {
  for (const tema of ['light', 'dark']) {
    await definirTema(tema)
    await auditar(`${nome} (${tema === 'light' ? 'claro' : 'escuro'})`)
  }
}

// ---- tela de login (sem sessão)
await ir('/login')
await auditarNosDoisTemas('login')
await pagina.type('input[autocomplete=username]', 'maria')
await pagina.type('input[autocomplete=current-password]', 'errada')
await pagina.click('button[type=submit]')
await esperar(() => document.querySelector('[role=alert]'))
await auditarNosDoisTemas('login com mensagem de erro')

// ---- solicitante
await entrar('maria')
await esperar(() => document.querySelector('p.text-4xl'))
await auditarNosDoisTemas('dashboard')

await ir('/solicitacoes')
await esperar(() => document.querySelector('tbody tr'))
await auditarNosDoisTemas('listagem')

await pagina.type('input[type=search]', 'zzzz-nao-existe')
await pausa(900)
await auditarNosDoisTemas('listagem sem resultados')

await ir('/solicitacoes/nova')
await auditarNosDoisTemas('formulário de nova solicitação')
await clicar('Criar solicitação')
await pausa(300)
await auditarNosDoisTemas('formulário com erros de validação')

await ir('/solicitacoes/1')
await esperar(() => document.body.innerText.includes('Notebook não liga'))
await auditarNosDoisTemas('detalhes (autor, solicitação aberta)')

await clicar('Excluir')
await pausa(400)
await auditarNosDoisTemas('modal de exclusão aberto')
await pagina.keyboard.press('Escape')
await pausa(300)

await ir('/solicitacoes/1/editar')
await esperar(() => document.querySelector('input'))
await auditarNosDoisTemas('edição')

await ir('/rota-que-nao-existe')
await auditarNosDoisTemas('página não encontrada')
await ir('/solicitacoes/4')
await esperar(() => document.body.innerText.includes('Solicitação não encontrada'))
await auditarNosDoisTemas('detalhes de solicitação inexistente / de outro usuário')
await sair()

// ---- atendente
await entrar('atendente')
await ir('/solicitacoes/4')
await esperar(() => document.body.innerText.includes('Alterar status para'))
await auditarNosDoisTemas('detalhes (atendente, com caixa de atendimento)')

await t.finalizar()
