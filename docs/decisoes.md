# Registro de decisões

Base do Memorial Técnico. Uma entrada por decisão relevante: contexto, decisão, motivo e alternativas.

## 001 — PostgreSQL com SQL direto (sem ORM)
- **Decisão:** PostgreSQL acessado pelo driver `pg`, sem ORM.
- **Motivo:** o desafio exige scripts SQL de criação e dicionário de dados; com SQL direto o `schema.sql` é o que de fato roda, e as queries ficam visíveis e explicáveis.
- **Alternativas:** Prisma/TypeORM (menos código, mas esconde o SQL); SQLite (setup mais simples, menos próximo de produção).

## 002 — Dois perfis de usuário (solicitante e atendente)
- **Decisão:** `solicitante` vê e gerencia só as suas solicitações; `atendente` vê todas e altera status.
- **Motivo:** o enunciado fala em "alterar status" sem dizer quem pode; separar perfis demonstra controle de acesso.

## 003 — Node.js + TypeScript + Express 5 no backend
- **Decisão:** API em Node.js com TypeScript e Express 5.
- **Motivo:** TypeScript pega erros de tipo antes de rodar; Express é simples, muito documentado e deixa a organização em camadas explícita. O Express 5 encaminha erros de funções `async` ao middleware de erro sem `try/catch` em cada rota.
- **Alternativas:** NestJS (estrutura pronta, mas mais conceitos e código de base para um escopo pequeno); Fastify (mais rápido, comunidade menor).

## 004 — `bcryptjs` em vez de `bcrypt`
- **Decisão:** usar `bcryptjs` para o hash de senhas.
- **Motivo:** é JavaScript puro, sem compilação de código nativo. Evita falhas de build em Docker (imagens Alpine) e no CI, e a diferença de desempenho é irrelevante nesta escala.
- **Alternativas:** `bcrypt` nativo (mais rápido, mas exige toolchain de compilação); `argon2` (mais moderno, também nativo).

## 005 — Validação com zod
- **Decisão:** zod valida variáveis de ambiente e as requisições (body, query, params).
- **Motivo:** uma única definição de schema gera a validação e o tipo TypeScript, sem duplicar. Dados inválidos são barrados no middleware, antes da regra de negócio.
- **Alternativas:** Joi/Yup (sem inferência de tipos tão direta); validação manual (repetitiva e propensa a erro).

## 006 — Camadas: routes → controllers → services → repositories
- **Decisão:** separar roteamento, tratamento HTTP, regra de negócio e acesso a dados.
- **Motivo:** cada camada tem uma responsabilidade; as regras (ex.: "só edita se aberta") ficam no service, testáveis sem HTTP, e o SQL fica isolado nos repositories.
- **Alternativas:** lógica direto nas rotas (mais rápido de escrever, difícil de testar e manter).

## 007 — `app.ts` separado de `server.ts`
- **Decisão:** `app.ts` monta o Express; `server.ts` só abre a porta e trata o encerramento.
- **Motivo:** os testes (Supertest) importam o `app` sem abrir porta de rede.

## 008 — Erros padronizados com `AppError` e middleware global
- **Decisão:** erros esperados usam `AppError` (status + mensagem); um middleware único converte tudo para `{ "erro": "...", "detalhes": ... }`. Erros inesperados viram 500 genérico, sem vazar detalhes internos.
- **Motivo:** formato consistente para o frontend e segurança básica (não expor stack trace nem mensagens do banco).

## 009 — Sessão via JWT em cookie httpOnly
- **Decisão:** após o login, a API emite um JWT guardado em cookie `httpOnly`.
- **Motivo:** JavaScript da página não consegue ler o cookie, o que reduz o risco de roubo do token por XSS. JWT dispensa armazenar sessões no servidor, simplificando Docker e deploy.
- **Alternativas:** token em `localStorage` (exposto a XSS); sessões no servidor com Redis (mais infraestrutura).
- **Implementado:** cookie `httpOnly`, `SameSite=Lax` (o navegador não o envia em requisições de outros sites, mitigando CSRF) e `Secure` controlado por `COOKIE_SECURE` (ligar apenas quando houver HTTPS). O JWT carrega só o id (`sub`) e o perfil; o logout limpa o cookie.

## 010 — Variáveis de ambiente validadas na inicialização
- **Decisão:** `config/env.ts` valida o `.env` com zod e interrompe a aplicação se algo faltar ou for inválido (ex.: `JWT_SECRET` curto).
- **Motivo:** falhar cedo e com mensagem clara, em vez de erro obscuro durante uma requisição. Segredos ficam fora do git (`.env` ignorado, `.env.example` versionado).

## 011 — Mensagem única para "usuário inexistente" e "senha errada"
- **Decisão:** o login devolve sempre `Usuário ou senha inválidos` (401). Quando o usuário não existe, a senha é comparada contra um hash falso.
- **Motivo:** evita enumeração de usuários: nem a mensagem nem o tempo de resposta revelam quais logins existem.

## 012 — Usuário é reconsultado no banco a cada requisição autenticada
- **Decisão:** o middleware `autenticar` valida o JWT e também busca o usuário no banco.
- **Motivo:** um usuário removido perde acesso imediatamente, mesmo com token ainda válido. O custo é uma consulta por id (chave primária), irrelevante nesta escala. Em produção, com muito tráfego, seria possível cachear.

## 013 — Rate limit no login com `express-rate-limit`
- **Decisão:** máximo de 10 tentativas por IP a cada 15 minutos em `POST /auth/login`; excedido, responde 429 no formato padrão de erro.
- **Motivo:** dificulta ataque de força bruta, com custo mínimo de implementação. Desativado em `NODE_ENV=test` para não interferir nos testes.
- **Limitação:** contador em memória, não compartilhado entre instâncias. Em produção com várias réplicas, usar um armazenamento compartilhado (ex.: Redis).

## 014 — Autorização por perfil em middleware reutilizável
- **Decisão:** `exigirPerfil('atendente')` protege rotas por perfil; as regras que dependem do dado (ex.: "só o autor edita") ficam no service.
- **Motivo:** separa "quem pode usar esta rota" (middleware, declarativo) de "quem pode agir sobre este registro" (regra de negócio).
