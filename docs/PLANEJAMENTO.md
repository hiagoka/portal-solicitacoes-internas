# Planejamento — Portal de Solicitações Internas

Prazo de entrega: **segunda, 05/10/2026**. Início: quinta, 01/10/2026.
Regra: uma tarefa = um resultado verificável = (idealmente) um commit.

## Decisões fechadas

| Item | Decisão |
|---|---|
| Backend | Node.js + TypeScript + Express |
| Banco | PostgreSQL, SQL direto (driver `pg`, sem ORM) |
| Frontend | React + Vite + TypeScript |
| Autenticação | bcrypt + JWT em cookie httpOnly |
| Perfis | `solicitante` (só as suas) e `atendente` (todas, altera status) |
| Diferenciais | Docker Compose, testes automatizados, CI, responsividade |

## Modelo de dados

**usuarios**: id, nome, usuario (único), senha_hash, perfil, criado_em
**solicitacoes**: id (código), titulo, descricao, categoria, status, criado_em, atualizado_em, usuario_id (FK)

Categorias: TI, RH, Compras, Financeiro, Infraestrutura. Status: aberto, em_atendimento, concluido.

## API alvo

| Método | Rota | Regra |
|---|---|---|
| POST | /auth/login | Valida credenciais, cria sessão |
| POST | /auth/logout | Encerra sessão |
| GET | /auth/me | Usuário logado |
| GET | /solicitacoes | Lista + filtros (período, categoria, status, texto) |
| POST | /solicitacoes | Cria com status aberto |
| GET | /solicitacoes/:id | Detalhes |
| PUT | /solicitacoes/:id | Só aberta e do próprio autor |
| DELETE | /solicitacoes/:id | Só aberta e do próprio autor |
| PATCH | /solicitacoes/:id/status | Só atendente |
| GET | /dashboard | Totais por status (escopo por perfil) |

---

# DIA 1 — Qui 01/10: Banco e esqueleto do backend

## Fase 1 — Banco de dados
- [x] **1.1** Criar `database/schema.sql` com a tabela `usuarios`
- [x] **1.2** Adicionar a tabela `solicitacoes` com a FK para `usuarios`
- [x] **1.3** Adicionar CHECKs para categoria, status e perfil (valores válidos)
- [x] **1.4** Adicionar índices (status, categoria, criado_em, usuario_id)
- [x] **1.5** Criar `database/seed.sql` com 3 usuários (1 atendente, 2 solicitantes) e senhas com hash
- [x] **1.6** Adicionar ~10 solicitações de exemplo ao seed, variando categoria, status e datas
- [x] **1.7** Subir um Postgres local (container) e rodar schema + seed para validar
- [x] **1.8** Escrever `database/dicionario-de-dados.md` (tabela usuarios)
- [x] **1.9** Completar o dicionário (tabela solicitacoes, relacionamentos, regras)

## Fase 2 — Esqueleto do backend
- [x] **2.1** Inicializar `backend/` (package.json, TypeScript, tsconfig)
- [x] **2.2** Instalar dependências (express, pg, zod, bcrypt, jsonwebtoken, cookie-parser, cors, dotenv)
- [x] **2.3** Criar a estrutura de pastas (routes, controllers, services, repositories, middlewares, config)
- [x] **2.4** Criar `config/env.ts` (leitura e validação das variáveis) e `.env.example`
- [x] **2.5** Criar `config/database.ts` (pool de conexões com o Postgres)
- [x] **2.6** Criar `app.ts` (Express, JSON, cookies, CORS) e `server.ts` (sobe o servidor)
- [x] **2.7** Criar a rota `GET /health` e testar com o banco conectado
- [x] **2.8** Criar a classe `AppError` e o middleware global de tratamento de erros
- [x] **2.9** Criar o middleware genérico de validação com zod
- [x] **2.10** Configurar scripts npm (dev, build, start, test)

---

# DIA 2 — Sex 02/10: Backend completo

## Fase 3 — Autenticação
- [ ] **3.1** Criar `usuarioRepository` (buscar por usuário e por id)
- [ ] **3.2** Criar `authService.login` (compara senha com bcrypt, gera JWT)
- [ ] **3.3** Criar schema de validação do login (zod)
- [ ] **3.4** Criar `POST /auth/login` (grava cookie httpOnly)
- [ ] **3.5** Criar o middleware `autenticar` (lê o cookie, valida o JWT, anexa o usuário à requisição)
- [ ] **3.6** Criar `GET /auth/me`
- [ ] **3.7** Criar `POST /auth/logout` (limpa o cookie)
- [ ] **3.8** Criar o middleware `exigirPerfil('atendente')`
- [ ] **3.9** Adicionar rate limit no login (segurança básica)

## Fase 4 — CRUD de solicitações
- [ ] **4.1** Criar tipos e schemas zod (criar, editar)
- [ ] **4.2** Criar `solicitacaoRepository.inserir`
- [ ] **4.3** Criar `solicitacaoService.criar` (status aberto e usuário vêm do servidor, nunca do cliente)
- [ ] **4.4** Criar `POST /solicitacoes`
- [ ] **4.5** Criar `solicitacaoRepository.buscarPorId` (com JOIN para o nome do solicitante)
- [ ] **4.6** Criar `GET /solicitacoes/:id` (solicitante só vê a sua; atendente vê qualquer uma)
- [ ] **4.7** Criar `solicitacaoRepository.listar` (sem filtros, com JOIN do solicitante)
- [ ] **4.8** Criar `GET /solicitacoes` (solicitante vê só as suas; atendente vê todas)
- [ ] **4.9** Criar `solicitacaoRepository.atualizar`
- [ ] **4.10** Criar `solicitacaoService.editar` (só aberta e só do autor, senão 403/409)
- [ ] **4.11** Criar `PUT /solicitacoes/:id`
- [ ] **4.12** Criar `solicitacaoRepository.excluir`
- [ ] **4.13** Criar `solicitacaoService.excluir` (mesmas regras da edição)
- [ ] **4.14** Criar `DELETE /solicitacoes/:id`

## Fase 5 — Filtros, status e dashboard
- [ ] **5.1** Filtro por status na listagem
- [ ] **5.2** Filtro por categoria
- [ ] **5.3** Filtro por texto livre no título (ILIKE)
- [ ] **5.4** Filtro por período (data inicial e final)
- [ ] **5.5** Combinar os filtros com query parametrizada (sem concatenar SQL)
- [ ] **5.6** Validar os parâmetros de query com zod
- [ ] **5.7** Adicionar paginação à listagem
- [ ] **5.8** Criar `PATCH /solicitacoes/:id/status` (só atendente)
- [ ] **5.9** Validar transições de status permitidas
- [ ] **5.10** Criar `dashboardRepository` (contagens por status com GROUP BY)
- [ ] **5.11** Criar `GET /dashboard` (escopo por perfil)

## Fase 6 — Testes do backend
- [ ] **6.1** Configurar Vitest + Supertest e um banco de testes
- [ ] **6.2** Testes de login (sucesso, senha errada, usuário inexistente)
- [ ] **6.3** Testes de acesso sem autenticação (401)
- [ ] **6.4** Testes de criação (sucesso e validação)
- [ ] **6.5** Testes de edição e exclusão (aberta, não aberta e de outro usuário)
- [ ] **6.6** Testes de filtros
- [ ] **6.7** Testes de alteração de status e permissão
- [ ] **6.8** Teste do dashboard

---

# DIA 3 — Sáb 03/10: Frontend

## Fase 7 — Base do frontend
- [ ] **7.1** Criar o projeto em `frontend/` com Vite + React + TS
- [ ] **7.2** Instalar react-router-dom e configurar as rotas
- [ ] **7.3** Criar o cliente HTTP (`api/client.ts`) com cookies e tratamento de erros
- [ ] **7.4** Criar os tipos compartilhados (Solicitacao, Usuario, Status, Categoria)
- [ ] **7.5** Criar estilos globais e variáveis de tema (CSS)
- [ ] **7.6** Criar o layout base (cabeçalho, menu, área de conteúdo)

## Fase 8 — Autenticação no frontend
- [ ] **8.1** Criar o `AuthContext` (usuário atual, login, logout, carregamento inicial via `/auth/me`)
- [ ] **8.2** Criar a página de Login (formulário)
- [ ] **8.3** Exibir erros de login (credenciais inválidas)
- [ ] **8.4** Criar a rota protegida (redireciona ao login se não autenticado)
- [ ] **8.5** Criar o botão de logout no cabeçalho

## Fase 9 — Listagem
- [ ] **9.1** Criar `api/solicitacoes.ts` (funções de chamada à API)
- [ ] **9.2** Criar a página de listagem com tabela (código, título, categoria, solicitante, data, status)
- [ ] **9.3** Criar o componente `StatusBadge`
- [ ] **9.4** Criar estados de carregando, vazio e erro
- [ ] **9.5** Criar a barra de filtros (status e categoria)
- [ ] **9.6** Adicionar filtros de texto e período
- [ ] **9.7** Adicionar o debounce na busca por texto
- [ ] **9.8** Adicionar a paginação

## Fase 10 — Formulários e detalhes
- [ ] **10.1** Criar o componente de formulário (título, descrição, categoria) com validação
- [ ] **10.2** Criar a página "Nova solicitação"
- [ ] **10.3** Criar a página "Editar solicitação" (preenche os dados atuais)
- [ ] **10.4** Criar a página de Detalhes
- [ ] **10.5** Adicionar os botões Editar e Excluir (só aparecem se aberta e do autor)
- [ ] **10.6** Criar o modal de confirmação de exclusão
- [ ] **10.7** Criar o seletor de alteração de status (só atendente)
- [ ] **10.8** Criar notificações de sucesso e erro (toast)

## Fase 11 — Dashboard
- [ ] **11.1** Criar `api/dashboard.ts`
- [ ] **11.2** Criar o componente `CardIndicador`
- [ ] **11.3** Criar a página Dashboard com os 4 indicadores (total, abertas, em atendimento, concluídas)
- [ ] **11.4** Criar estados de carregando e erro do dashboard

---

# DIA 4 — Dom 04/10: Infra e acabamento

## Fase 12 — Docker
- [ ] **12.1** Criar o `Dockerfile` do backend (multi-stage)
- [ ] **12.2** Criar o `Dockerfile` do frontend (build + Nginx)
- [ ] **12.3** Criar o `docker-compose.yml` com o serviço do Postgres
- [ ] **12.4** Montar `schema.sql` e `seed.sql` em `docker-entrypoint-initdb.d`
- [ ] **12.5** Adicionar o backend ao compose (healthcheck e depends_on)
- [ ] **12.6** Adicionar o frontend ao compose
- [ ] **12.7** Criar o `.env.example` da raiz
- [ ] **12.8** Testar `docker compose up` a partir de um clone limpo

## Fase 13 — CI
- [ ] **13.1** Criar o workflow `.github/workflows/ci.yml` (checkout, setup-node)
- [ ] **13.2** Adicionar o job do backend (install, build, test com serviço Postgres)
- [ ] **13.3** Adicionar o job do frontend (install, lint, build)
- [ ] **13.4** Conferir o resultado verde no GitHub Actions

## Fase 14 — Responsividade e UX
- [ ] **14.1** Adaptar o layout/menu para celular
- [ ] **14.2** Adaptar a tabela para telas pequenas (cards ou scroll horizontal)
- [ ] **14.3** Adaptar os formulários e os filtros
- [ ] **14.4** Revisar acessibilidade básica (labels, foco, contraste)
- [ ] **14.5** Revisão de ponta a ponta de todos os fluxos com os 2 perfis

---

# DIA 5 — Seg 05/10: Documentação e entrega

## Fase 15 — README
- [ ] **15.1** Descrição do projeto e funcionalidades
- [ ] **15.2** Pré-requisitos (linguagem, banco, dependências)
- [ ] **15.3** Instalação: banco de dados
- [ ] **15.4** Instalação: backend
- [ ] **15.5** Instalação: frontend
- [ ] **15.6** Configuração: variáveis de ambiente
- [ ] **15.7** Execução com e sem Docker
- [ ] **15.8** Credenciais dos usuários de teste
- [ ] **15.9** Como rodar os testes

## Fase 16 — Memorial Técnico
- [ ] **16.1** Seção: tecnologias utilizadas (lista completa)
- [ ] **16.2** Seção: justificativa técnica por tecnologia (motivo, benefícios, alternativas, impacto)
- [ ] **16.3** Seção: estrutura geral e camadas
- [ ] **16.4** Seção: modelagem de dados
- [ ] **16.5** Seção: estratégia de autenticação
- [ ] **16.6** Seção: comunicação frontend ↔ backend
- [ ] **16.7** Seção: organização do código-fonte
- [ ] **16.8** Seção: análise crítica (limitações, melhorias, o que mudaria em produção)

## Fase 17 — Evidências e entrega
- [ ] **17.1** Print: login
- [ ] **17.2** Print: listagem com filtros
- [ ] **17.3** Print: criar/editar solicitação
- [ ] **17.4** Print: detalhes e alteração de status
- [ ] **17.5** Print: dashboard
- [ ] **17.6** Print: versão mobile
- [ ] **17.7** Revisão final do checklist de entrega
- [ ] **17.8** Push final e verificação do repositório no GitHub
- [ ] **17.9** Envio ao avaliador

---

## Checklist de entrega (exigido pelo PDF)
- [ ] Código-fonte de backend e frontend
- [ ] Instruções de execução
- [ ] Scripts SQL e dicionário de dados
- [ ] Memorial Técnico
- [ ] README
- [ ] Evidências (prints ou vídeo)

## Memorial: anotar durante o caminho
A cada decisão relevante, registrar o motivo em `docs/decisoes.md`. No final vira o memorial.

## Riscos
- **Memorial deixado para o fim:** anotar decisões ao longo do caminho.
- **Escopo:** os 5 requisitos funcionais vêm antes de qualquer diferencial.
- **"Funciona na minha máquina":** testar o Docker Compose a partir de um clone limpo.
- **Corte, se apertar:** paginação (5.7, 9.8), rate limit (3.9) e transições de status (5.9) são os primeiros candidatos.
