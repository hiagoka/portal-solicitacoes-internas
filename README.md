# Portal de Solicitações Internas

[![CI](https://github.com/hiagoka/portal-solicitacoes-internas/actions/workflows/ci.yml/badge.svg)](https://github.com/hiagoka/portal-solicitacoes-internas/actions/workflows/ci.yml)

Sistema web para colaboradores registrarem demandas internas (TI, RH, Compras, Financeiro e Infraestrutura) e
acompanharem sua evolução até a conclusão. Desenvolvido como mini-projeto full stack da 2ª etapa do processo seletivo
para Desenvolvedor(a) de Sistemas Júnior da **bit Soluções**.

![Dashboard do solicitante](docs/prints/03-dashboard-solicitante.png)

## Sumário

1. [Funcionalidades](#funcionalidades)
2. [Tecnologias](#tecnologias)
3. [Como executar com Docker (recomendado)](#como-executar-com-docker-recomendado)
4. [Como executar sem Docker (instalação manual)](#como-executar-sem-docker-instalação-manual)
5. [Configuração](#configuração)
6. [Usuários de teste](#usuários-de-teste)
7. [Testes](#testes)
8. [API](#api)
9. [Banco de dados](#banco-de-dados)
10. [Estrutura do projeto](#estrutura-do-projeto)
11. [Integração contínua](#integração-contínua)
12. [Documentação complementar](#documentação-complementar)
13. [Limitações conhecidas](#limitações-conhecidas)
14. [Solução de problemas](#solução-de-problemas)

## Funcionalidades

| Requisito do desafio | Como foi atendido |
|---|---|
| **Autenticação** (usuário e senha, sessão, logout; só autenticados acessam) | Login com senha criptografada (bcrypt); sessão por token JWT em cookie `HttpOnly`; todas as rotas da API e telas, exceto o login, exigem autenticação |
| **Cadastro de solicitações** (título, descrição, categoria; data, solicitante e status "Aberto" automáticos; criar, editar e excluir enquanto aberta) | Formulário com validação imediata e no servidor; data, solicitante e status definidos pelo servidor; só o autor edita ou exclui, e apenas enquanto a solicitação estiver aberta. A exclusão é **lógica**: a solicitação some da interface, mas o registro permanece no banco |
| **Gerenciamento** (listagem com código, título, categoria, solicitante, data e status; alterar status; detalhes) | Tabela (cartões no celular) com paginação; tela de detalhes com **histórico de status** (quem mudou, de quê para quê e quando); o atendente altera o status entre *Aberto*, *Em Atendimento* e *Concluído* com transições válidas |
| **Consulta e filtros** (período, categoria, status, texto no título) | Os quatro filtros, combináveis, mais a escolha de itens por página. Tudo fica na **URL**: o link de uma lista filtrada pode ser compartilhado, e recarregar ou voltar mantém a tela |
| **Dashboard** (total, abertas, em atendimento, concluídas) | Quatro indicadores (cada um é um link para a lista já filtrada) e uma barra de distribuição por status |

**Além do pedido:**

- **Dois perfis de usuário.** O *solicitante* vê e gerencia apenas as próprias solicitações. O *atendente* vê todas e altera o status.
- **Histórico de status** gravado na mesma transação da operação (ou valem os dois registros, ou nenhum) e **exclusão lógica**, que preserva a trilha de auditoria.
- **Tema claro e escuro**, com a escolha salva no navegador.
- **Interface responsiva** (testada em 360, 390 e 768 px) e **acessível**: auditoria automática com axe-core (WCAG 2.2 AA) nos dois temas.
- **Docker Compose** (banco, API e interface com um comando), **testes automatizados** em três camadas e **CI/CD** no GitHub Actions.

| | |
|---|---|
| ![Listagem com filtros](docs/prints/05-listagem-com-filtros.png) | ![Atendente alterando o status](docs/prints/14-atendente-alterando-status.png) |
| ![Tema escuro](docs/prints/16-listagem-tema-escuro.png) | ![Celular](docs/prints/17-celular-listagem-em-cartoes.png) |

Todas as imagens estão em [`docs/prints/`](docs/prints) (21 capturas, geradas por `e2e/prints.mjs`).

## Tecnologias

| Camada | Tecnologias |
|---|---|
| Banco de dados | PostgreSQL 16 (SQL escrito à mão, sem ORM) |
| Backend | Node.js 22, TypeScript, Express 5, `pg`, Zod (validação), `bcryptjs`, `jsonwebtoken`, `express-rate-limit` |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, React Router |
| Testes | Vitest, Supertest, Puppeteer (`puppeteer-core`), axe-core |
| Infraestrutura | Docker e Docker Compose, nginx, GitHub Actions |

A justificativa de cada escolha está no [Memorial Técnico](docs/memorial-tecnico.md).

## Como executar com Docker (recomendado)

**Pré-requisito:** [Docker](https://docs.docker.com/get-docker/) com o Compose v2. Nada além disso.

```bash
git clone https://github.com/hiagoka/portal-solicitacoes-internas.git
cd portal-solicitacoes-internas
docker compose up --build
```

Quando os três serviços estiverem saudáveis (cerca de 1 minuto na primeira vez), abra **http://localhost:8080** e
entre com um dos [usuários de teste](#usuários-de-teste).

O que sobe: `db` (PostgreSQL, inicializado automaticamente pelos scripts de [`database/`](database)), `backend`
(API) e `frontend` (nginx servindo a interface e repassando `/api` ao backend).

| Quero... | Comando |
|---|---|
| Rodar em segundo plano | `docker compose up --build -d` |
| Ver os logs | `docker compose logs -f` |
| Parar mantendo os dados | `docker compose down` |
| Voltar ao estado inicial de demonstração | `docker compose down -v` |
| Mudar a porta (se a 8080 estiver ocupada) | `FRONTEND_PORT=8081 docker compose up --build` |

> **Já tinha subido o sistema antes de uma atualização do repositório?** Rode `docker compose down -v` uma vez para recriar o banco: os scripts SQL só são executados na criação do volume.

Não é preciso criar o arquivo `.env`: todos os valores têm padrões de demonstração. Para personalizá-los, copie
[`.env.example`](.env.example) para `.env` (veja [Configuração](#configuração)).

> Os segredos padrão (senha do banco e `JWT_SECRET`) são **públicos**: qualquer pessoa que leia este repositório pode usá-los
> para forjar uma sessão (inclusive a do atendente). Servem apenas para demonstração, e a API avisa disso no log ao iniciar.
> Em qualquer ambiente real, defina valores próprios (por exemplo, `openssl rand -hex 32`), coloque
> `PERMITIR_SEGREDOS_DE_DEMONSTRACAO=false` e sirva por HTTPS com `COOKIE_SECURE=true`: com o segredo de demonstração e sem essa
> autorização, a API se recusa a iniciar em produção.

## Como executar sem Docker (instalação manual)

### Pré-requisitos

- **Node.js 22 ou superior** (com npm). Linguagem do projeto: TypeScript.
- **PostgreSQL** (testado com a versão 16).
- Dependências: instaladas pelo `npm ci` em cada pasta (listadas em `package.json`).

### 1. Banco de dados

Crie um banco chamado `portal` e execute os dois scripts, nesta ordem:

```bash
createdb -U postgres portal
psql -U postgres -d portal -f database/schema.sql   # cria as tabelas (apaga as existentes)
psql -U postgres -d portal -f database/seed.sql     # usuários e solicitações de demonstração
```

Sem PostgreSQL instalado? Suba só o banco em um contêiner e rode os mesmos scripts:

```bash
docker run -d --name portal-db -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=portal -p 5432:5432 postgres:16-alpine
# aguarde alguns segundos até o banco aceitar conexões, depois:
docker exec -i portal-db psql -U postgres -d portal < database/schema.sql
docker exec -i portal-db psql -U postgres -d portal < database/seed.sql
```

### 2. Backend (API)

```bash
cd backend
cp .env.example .env      # ajuste DATABASE_URL e JWT_SECRET se necessário
npm ci
npm run dev               # http://localhost:3000  (recarrega ao salvar)
```

Verificação rápida: `curl http://localhost:3000/health` deve responder `{"status":"ok"}`.
Para produção: `npm run build` e `npm start`.

### 3. Frontend

Em outro terminal:

```bash
cd frontend
npm ci
npm run dev               # http://localhost:5173
```

Abra **http://localhost:5173** e entre com um dos [usuários de teste](#usuários-de-teste). O frontend espera a API em
`http://localhost:3000` (mude com `VITE_API_URL`, veja abaixo).

## Configuração

### Backend (`backend/.env`, modelo em [`backend/.env.example`](backend/.env.example))

| Variável | Padrão | Descrição |
|---|---|---|
| `DATABASE_URL` | — (obrigatória) | Conexão com o PostgreSQL, ex.: `postgres://postgres:postgres@localhost:5432/portal` |
| `JWT_SECRET` | — (obrigatória, mín. 16 caracteres) | Segredo que assina os tokens de sessão |
| `PORT` | `3000` | Porta da API |
| `JWT_EXPIRES_IN` | `8h` | Validade da sessão |
| `CORS_ORIGIN` | `http://localhost:5173` | Origem do frontend autorizada a chamar a API |
| `COOKIE_SECURE` | `false` | `true` somente quando servido por HTTPS |
| `PERMITIR_SEGREDOS_DE_DEMONSTRACAO` | `false` | Em `NODE_ENV=production`, a API **recusa partir** com um segredo de demonstração publicado no repositório (como o do `.env.example`), salvo com `true`. O `docker-compose.yml` de demonstração o liga e a API mostra um aviso no log |
| `TRUST_PROXY` | `false` | `true` somente atrás de um proxy reverso confiável (o `docker-compose.yml` já define) |
| `NODE_ENV` | `development` | `development`, `test` ou `production` |

### Frontend

| Variável | Padrão | Descrição |
|---|---|---|
| `VITE_API_URL` | `http://localhost:3000` | Endereço da API visto pelo navegador (no Docker é `/api`) |

### Docker Compose (arquivo `.env` na raiz, modelo em [`.env.example`](.env.example))

| Variável | Padrão | Descrição |
|---|---|---|
| `FRONTEND_PORT` | `8080` | Porta da interface no seu computador (a API só é alcançável por ela, em `/api`) |
| `POSTGRES_PASSWORD` | `portal_demo_password` | Senha do banco (evite caracteres especiais) |
| `JWT_SECRET` | segredo de demonstração | **Troque fora da demonstração** |
| `JWT_EXPIRES_IN` | `8h` | Validade da sessão |
| `COOKIE_SECURE` | `false` | `true` somente com HTTPS |

## Usuários de teste

Criados pelo [`database/seed.sql`](database/seed.sql). **Senha de todos: `senha123`.**

| Usuário | Nome | Perfil | O que pode fazer |
|---|---|---|---|
| `maria` | Maria Souza | Solicitante | Criar solicitações; ver, editar e excluir as próprias enquanto abertas |
| `joao` | João Lima | Solicitante | O mesmo, com as solicitações dele |
| `atendente` | Ana Atendente | Atendente | Ver todas as solicitações e alterar o status |

## Testes

Três camadas, da mais barata à mais completa:

| Camada | Quantidade | Como rodar |
|---|---|---|
| **Backend** (Vitest + Supertest, contra um PostgreSQL real) | 205 testes | `cd backend && npm test` |
| **Frontend** (Vitest: regras, validação, formatação, URL da listagem, cliente HTTP, contraste da paleta) | 120 testes | `cd frontend && npm test` |
| **Ponta a ponta** (Chrome real: autenticação, listagem, CRUD, dashboard, acessibilidade, responsividade) | 177 verificações | `cd e2e && npm ci && bash run.sh` |

- **Backend:** precisa de um PostgreSQL acessível. Por padrão usa `postgres://postgres:postgres@localhost:5432/portal_test`
  (o banco `portal_test` é criado automaticamente e recriado a cada teste; **nunca** é o banco de desenvolvimento).
  Para outro endereço, defina `TEST_DATABASE_URL`.
- **Frontend:** além de `npm test`, rode `npm run typecheck`, `npm run lint` e `npm run check:cores`
  (falha se houver cor fora do arquivo de tema `src/styles/theme.ts`).
- **Ponta a ponta:** exige o sistema no ar (por exemplo, `docker compose up -d --build --wait`) e o Chrome instalado.
  Variáveis: `APP_URL` e `API_URL` (padrão: `http://localhost:8080` e `http://localhost:8080/api`), `CHROME_PATH`,
  `SUITES` (ex.: `SUITES="auth lista"`) e `DB_EXEC` (comando do `psql`; o padrão usa o contêiner do Compose). O `run.sh`
  restaura o banco entre as suítes, então **apaga e recria os dados**: use apenas contra um ambiente de demonstração.
  Para gerar de novo as imagens da documentação: `cd e2e && npm run prints`.

## API

Base: `http://localhost:3000` em desenvolvimento manual; no Docker a API não é publicada e fica em `/api` pela porta da interface (`http://localhost:8080/api`). Todas as rotas, exceto
`/health` e `/auth/login`, exigem o cookie de sessão. Respostas de erro seguem o formato
`{ "erro": "mensagem", "detalhes": [{ "campo": "...", "mensagem": "..." }] }`.

| Método | Rota | Descrição | Quem pode |
|---|---|---|---|
| `GET` | `/health` | Verifica a API e a conexão com o banco | público |
| `POST` | `/auth/login` | Autentica (`usuario`, `senha`) e define o cookie de sessão | público (limitado a 10 falhas / 15 min por IP) |
| `POST` | `/auth/logout` | Encerra a sessão | autenticado |
| `GET` | `/auth/me` | Dados do usuário logado | autenticado |
| `GET` | `/solicitacoes` | Lista paginada. Filtros: `status`, `categoria`, `busca`, `de`, `ate` (AAAA-MM-DD), `pagina`, `porPagina` (1–50, padrão 10) | autenticado (solicitante vê só as suas) |
| `POST` | `/solicitacoes` | Cria (`titulo`, `descricao`, `categoria`); status, data e solicitante são definidos pelo servidor | autenticado |
| `GET` | `/solicitacoes/:id` | Detalhes | autor ou atendente |
| `PUT` | `/solicitacoes/:id` | Edita | somente o autor, e só se estiver aberta |
| `DELETE` | `/solicitacoes/:id` | Exclui (logicamente: preenche `excluido_em`; a linha permanece no banco) | somente o autor, e só se estiver aberta |
| `PATCH` | `/solicitacoes/:id/status` | Altera o status (`aberto`, `em_atendimento`, `concluido`) e registra o evento no histórico | somente atendente, com transições válidas |
| `GET` | `/solicitacoes/:id/historico` | Linha do tempo de status: abertura e cada mudança, com quem fez e quando | autor ou atendente |
| `GET` | `/dashboard` | Totais por status | autenticado (escopo por perfil) |

Códigos usados: `400` dados inválidos, `401` não autenticado, `403` sem permissão, `404` não encontrado,
`409` conflito de estado (por exemplo, editar uma solicitação que já não está aberta) e `429` excesso de tentativas de login.

## Banco de dados

- [`database/schema.sql`](database/schema.sql): criação das tabelas `usuarios`, `solicitacoes` e `historico_status`, restrições e índices.
- [`database/seed.sql`](database/seed.sql): 3 usuários, 10 solicitações e o histórico de status delas (dados de demonstração).
- Tabelas: `usuarios`, `solicitacoes` (com exclusão lógica) e `historico_status`.
- [`database/dicionario-de-dados.md`](database/dicionario-de-dados.md): dicionário de dados (colunas, tipos, regras e relacionamento).

## Estrutura do projeto

```
.
├── backend/                 API Node.js + TypeScript
│   ├── src/
│   │   ├── config/          variáveis de ambiente (validadas) e conexão com o banco
│   │   ├── routes/          mapa de rotas
│   │   ├── controllers/     tradução HTTP ↔ serviços
│   │   ├── services/        regras de negócio
│   │   ├── repositories/    SQL (única camada que fala com o banco)
│   │   ├── middlewares/     autenticação, perfis, validação, erros, rate limit
│   │   └── schemas/         validação de entrada (Zod)
│   └── tests/               testes de integração
├── frontend/                interface React + TypeScript
│   └── src/
│       ├── components/      ui/ (genéricos) e layout/
│       ├── features/        auth, solicitacoes, dashboard (páginas, componentes e hooks de cada uma)
│       ├── services/        único lugar com chamadas HTTP
│       ├── hooks/ contexts/ utilitários e estado global
│       ├── constants/       rótulos, categorias, rotas
│       └── styles/theme.ts  única fonte de cores (claro e escuro)
├── database/                scripts SQL e dicionário de dados
├── e2e/                     testes de ponta a ponta e gerador de prints
├── docs/                    memorial técnico, decisões, planejamento e prints
├── .github/workflows/       CI
└── docker-compose.yml
```

## Integração contínua

O workflow [`ci.yml`](.github/workflows/ci.yml) roda a cada push na `main` e em pull requests:

1. **Backend:** verificação de tipos, build e 205 testes contra um PostgreSQL de serviço.
2. **Frontend:** tipos, lint, regra de cores, 120 testes e build.
3. **Ponta a ponta:** só se os dois anteriores passarem. Sobe o sistema com Docker Compose e executa as 6 suítes no navegador
   (177 verificações); em caso de falha, anexa logs e capturas de tela.

## Documentação complementar

- [Memorial Técnico de Desenvolvimento](docs/memorial-tecnico.md) (também em [PDF](docs/memorial-tecnico.pdf)): tecnologias e justificativas, decisões de arquitetura e análise crítica. Para regenerar o PDF depois de editar o memorial: `cd e2e && npm ci && npm run pdf` (precisa de internet para desenhar os diagramas).
- [Registro de decisões](docs/decisoes.md): cada decisão tomada durante o desenvolvimento, com contexto e alternativas.
- [Planejamento](docs/PLANEJAMENTO.md): divisão do trabalho em tarefas e cronograma.

## Limitações conhecidas

Detalhadas e discutidas no memorial (seção de análise crítica). As principais:

- O histórico cobre só mudanças de status (editar o conteúdo não gera evento) e não há tela para restaurar solicitações excluídas.
- Sem HTTPS, `Content-Security-Policy` ou gestão de usuários na interface (os usuários vêm do `seed.sql`).
- O limite de tentativas de login usa memória do processo; com várias réplicas da API seria preciso um armazenamento compartilhado.
- Acessibilidade verificada por ferramenta automática; não foi testada com leitor de tela real.
- Não há notificações (por exemplo, e-mail ao mudar o status) nem comentários nas solicitações.

## Solução de problemas

| Sintoma | Causa e solução |
|---|---|
| `port is already allocated` / `Bind for 0.0.0.0:8080 failed` | A porta 8080 está em uso. Use `FRONTEND_PORT=8081 docker compose up --build` |
| `database "portal" does not exist` ao rodar os scripts | O PostgreSQL ainda está iniciando. Aguarde alguns segundos e repita |
| API responde `500` logo após subir, sem Docker | Os scripts `schema.sql` e `seed.sql` ainda não foram executados no banco apontado por `DATABASE_URL` |
| `Variáveis de ambiente inválidas` ao iniciar o backend | Falta `DATABASE_URL` ou `JWT_SECRET` (mín. 16 caracteres) no `backend/.env` |
| Erro `column "excluido_em" does not exist` ou `relation "historico_status" does not exist` | O banco foi criado por uma versão antiga do esquema. Os scripts SQL só rodam na criação do volume: use `docker compose down -v` (apaga os dados de demonstração) e suba de novo |
| Login retorna "Muitas tentativas" | 10 senhas erradas seguidas pelo mesmo IP em 15 min. Aguarde ou reinicie a API |
| Testes do backend não conectam | Defina `TEST_DATABASE_URL` com um usuário que possa criar bancos |
| Testes E2E não encontram o Chrome | Defina `CHROME_PATH` com o caminho do executável |
