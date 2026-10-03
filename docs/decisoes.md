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
- **Revisão:** a versão inicial contava também os logins bem-sucedidos; corrigido na decisão 051.

## 014 — Autorização por perfil em middleware reutilizável
- **Decisão:** `exigirPerfil('atendente')` protege rotas por perfil; as regras que dependem do dado (ex.: "só o autor edita") ficam no service.
- **Motivo:** separa "quem pode usar esta rota" (middleware, declarativo) de "quem pode agir sobre este registro" (regra de negócio).

## 015 — 404 (e não 403) quando o solicitante acessa solicitação de outra pessoa
- **Decisão:** ao consultar, editar ou excluir uma solicitação que não é sua, o solicitante recebe `404 Solicitação não encontrada`.
- **Motivo:** responder 403 confirmaria que aquele código existe. Com 404, não há como descobrir códigos alheios por tentativa.
- **Códigos usados:** 404 (inexistente ou não visível), 403 (visível mas sem permissão, ex.: atendente tentando editar), 409 (conflito de estado: não está mais aberta).

## 016 — Condição de estado dentro do próprio UPDATE/DELETE
- **Decisão:** o repositório executa `UPDATE ... WHERE id = $1 AND status = 'aberto'` (idem no DELETE) e informa se alguma linha foi afetada.
- **Motivo:** o service verifica as regras antes, mas entre a verificação e a gravação o atendente pode mudar o status. Com a condição na própria query a regra é aplicada de forma atômica pelo banco, evitando condição de corrida.

## 017 — Campos controlados pelo servidor
- **Decisão:** o schema de criação/edição aceita apenas `titulo`, `descricao` e `categoria`. Status inicial e data vêm dos DEFAULTs do banco; o solicitante vem do usuário logado.
- **Motivo:** impedir que o cliente forje dados (ex.: criar já "concluído" ou em nome de outro usuário). Campos extras enviados são descartados pelo zod.

## 018 — API em camelCase, banco em snake_case
- **Decisão:** o repositório converte as linhas do banco (`criado_em`) para o formato da API (`criadoEm`) e aninha o solicitante (`solicitante: { id, nome }`).
- **Motivo:** convenção de cada lado (SQL vs. JavaScript), com a tradução concentrada em um único ponto.

## 019 — Mensagens de validação em português
- **Decisão:** `z.config(z.locales.pt())` na inicialização, mais mensagens customizadas nos campos de negócio.
- **Motivo:** a interface é em português; o frontend pode exibir `detalhes[].mensagem` diretamente.

## 020 — WHERE dinâmico com valores sempre parametrizados
- **Decisão:** a listagem monta o `WHERE` somando condições fixas no código (`s.status = $2`, ...) e envia os valores em `params`. O texto SQL nunca recebe dados do usuário.
- **Motivo:** combinar filtros opcionais sem concatenar entrada do usuário na query, eliminando SQL injection. Campos vazios (`?status=`) são tratados como "não informado" pelo schema.

## 021 — Busca textual com `ILIKE` e escape de curingas
- **Decisão:** busca por parte do título com `ILIKE '%texto%' ESCAPE '\'`, escapando `%`, `_` e `\` digitados pelo usuário.
- **Motivo:** sem diferenciar maiúsculas/minúsculas e sem que "%" funcione como curinga. Verificado: buscar `%` não retorna tudo.
- **Limitação:** `%texto%` não usa índice comum; para volume grande, usar `pg_trgm` ou busca full-text.

## 022 — Filtro de período pelo dia no fuso de Brasília
- **Decisão:** comparar `(criado_em AT TIME ZONE 'America/Sao_Paulo')::date` com as datas informadas, de forma inclusiva nas duas pontas.
- **Motivo:** o banco guarda `TIMESTAMPTZ` (UTC). Sem a conversão, uma solicitação aberta às 22h de Brasília cairia no dia seguinte e o filtro "daria errado" para o usuário.
- **Limitação:** fuso fixo no código; um sistema multi-região precisaria do fuso do usuário.

## 023 — Transições de status explícitas
- **Decisão:** mapa `TRANSICOES` em `types/solicitacao.ts`: aberto → em_atendimento | concluido; em_atendimento → aberto | concluido; concluido → em_atendimento (reabrir). Mesmo status ou transição fora do mapa responde 409.
- **Motivo:** o enunciado só lista os três status; impedir saltos inconsistentes (ex.: concluído voltar direto a aberto, o que permitiria ao autor editar de novo algo já atendido).
- **Concorrência:** o `UPDATE` inclui `AND status = <atual>`; se outro atendente alterou antes, a operação responde 409 em vez de sobrescrever.

## 024 — Dashboard com uma consulta agrupada
- **Decisão:** `SELECT status, COUNT(*) ... GROUP BY status`, com escopo por perfil (atendente: global; solicitante: só as suas). Status sem registros são completados com zero no service.
- **Motivo:** uma ida ao banco em vez de quatro `COUNT` separados; a regra de escopo é a mesma da listagem.

## 025 — Paginação adiada
- **Decisão:** a listagem devolve todas as solicitações do escopo, sem paginação.
- **Motivo:** priorizar os requisitos obrigatórios dentro do prazo; o volume esperado é pequeno.
- **Limitação / melhoria futura:** com milhares de registros, a resposta ficaria pesada. Evolução natural: `LIMIT/OFFSET` (ou paginação por cursor) e total de itens no cabeçalho.

## 026 — Testes de integração contra um PostgreSQL real
- **Decisão:** Vitest + Supertest exercitam a API de ponta a ponta (HTTP → middlewares → service → SQL → banco), sem mocks do banco.
- **Motivo:** as regras mais importantes vivem em queries (filtros, `UPDATE ... AND status = 'aberto'`, JOINs, fuso horário). Um mock não as validaria; já um teste de integração pegou, por exemplo, o filtro de data que devolvia 500 em vez de 400.
- **Alternativas:** testes unitários com repositórios falsos (mais rápidos, mas não provam o SQL); SQLite em memória (dialeto diferente do Postgres).

## 027 — Banco de testes isolado e recriado a cada teste
- **Decisão:** os testes usam o banco `portal_test` (criado automaticamente no `globalSetup`) e, antes de cada teste, rodam `schema.sql` + `seed.sql`. Os arquivos de teste executam em série (`fileParallelism: false`).
- **Motivo:** um teste nunca depende do que outro alterou, e usa exatamente os mesmos scripts que o avaliador executará (valida também o `schema.sql` e o `seed.sql`). O banco de desenvolvimento nunca é tocado.
- **Custo:** ~3 s para a suíte inteira, aceitável. Em escala maior, trocaria o reset por transações com rollback.

## 028 — Testes derivados das regras de negócio, com datas relativas
- **Decisão:** os testes cobrem a matriz de permissões (3 perfis × operações), transições de status, validações, escopo dos filtros e concorrência (duas alterações simultâneas). Datas esperadas são calculadas a partir de "hoje", no fuso de Brasília.
- **Motivo:** o seed usa datas relativas a `NOW()`; valores fixos fariam os testes quebrarem com o passar dos dias.
- **Fora do escopo:** o rate limit do login fica desativado em `NODE_ENV=test` e não tem teste automatizado. No frontend, os testes cobrem a camada de acesso à API e as constantes (decisão 034), não as telas.

## 029 — Frontend: React + Vite + TypeScript + Tailwind CSS
- **Decisão:** SPA em React 19 com Vite e TypeScript, estilizada com Tailwind CSS v4.
- **Motivo:** Vite dá build e recarregamento rápidos; TypeScript compartilha o vocabulário de tipos com a API; Tailwind permite estilizar sem folhas de CSS paralelas e, combinado ao tema centralizado, mantém o visual consistente.
- **Revisão:** o planejamento inicial previa CSS próprio. Mudou para Tailwind por pedido do projeto, que exige um tema único lido pelo framework.
- **Alternativas:** CSS Modules / CSS próprio (mais código repetido para variações de componentes); bibliotecas de UI como MUI (visual pronto, mas esconde as decisões de design e pesa no bundle); Next.js (SSR desnecessário para um portal interno autenticado).

## 030 — Tema centralizado em `styles/theme.ts`, claro e escuro
- **Decisão:** todas as cores, fontes, raios e sombras vivem em `src/styles/theme.ts`, com duas paletas de mesmas chaves (`Palette` obriga o escuro a definir tudo que o claro define). `tailwind.config.ts` lê o arquivo e emite variáveis CSS em `:root` (claro) e `.dark` (escuro). Componentes usam só nomes semânticos (`bg-surface`, `text-textMuted`, `bg-status-aberto`).
- **Motivo:** trocar a identidade visual é editar um arquivo; o modo escuro não exige `dark:` espalhado, pois a mesma classe aponta para uma variável que muda de valor.
- **Garantias:** a paleta padrão do Tailwind foi removida (`--color-*: initial`), então `bg-blue-500` nem gera CSS; o script `npm run check:cores` falha se achar `#hex`, `rgb()` ou classes da paleta padrão fora do `theme.ts`. Contraste calculado: todos os pares texto/fundo atingem WCAG AA (≥ 4,5:1) nos dois temas.
- **Limitação:** o fundo suave dos badges (cor a 10% de opacidade) reduz um pouco o contraste real em relação ao medido contra `surface`.

## 031 — Alternância de tema: classe `dark` no `<html>`, preferência salva
- **Decisão:** o tema inicial vem da preferência salva em `localStorage` ou, na primeira visita, do sistema operacional (`prefers-color-scheme`). Um script inline no `index.html` aplica a classe antes da renderização; o hook `useTheme` alterna e salva.
- **Motivo:** evita o "flash" de tema claro ao carregar e respeita a preferência do usuário, mantendo o botão de alternar funcional (que `prefers-color-scheme` sozinho não permitiria).

## 032 — Frontend em camadas: services → hooks → pages, com constantes separadas
- **Decisão:** só `services/` conhece URLs e `fetch`; hooks guardam estado (carregando, erro, dados); páginas apenas montam a tela. Textos de status/categorias e caminhos de rotas ficam em `constants/`, tipos do contrato em `types/`, e tudo é importado por `@/...` via `index.ts`.
- **Motivo:** trocar a API, uma label ou uma rota é mudar um lugar; telas e hooks ficam testáveis sem rede. É a mesma ideia de camadas do backend.

## 033 — `httpClient` único com `ApiError` tipado e sessão por cookie
- **Decisão:** toda chamada passa por `http.get/post/put/patch/delete`, com `credentials: 'include'` (cookie httpOnly enviado automaticamente). Falhas viram `ApiError { status, message, detalhes }`; falha de rede vira `status 0`. Um 401 em rota protegida dispara um callback registrado pelo `AuthContext` para encerrar a sessão; 401 em `/auth/login` (senha errada) e `/auth/me` (ninguém logado) não disparam.
- **Motivo:** o restante do código trata erros de um jeito só e a expiração de sessão leva ao login sem cada tela precisar tratar. Como o token está em cookie httpOnly, o JavaScript nunca o enxerga.
- **Limitação:** as transições de status estão duplicadas em `STATUS_TRANSICOES` (só para exibir opções válidas); a API segue como autoridade e responde 409 se divergirem.

## 034 — Testes do frontend limitados à camada de acesso e às constantes
- **Decisão:** Vitest cobre o `httpClient` (query, JSON, 204, erros, rede, sessão expirada) e a consistência das constantes. Os serviços foram verificados uma vez contra a API real (script descartável, não versionado).
- **Motivo:** é onde um erro de contrato ou de tratamento de falha afetaria todas as telas, com baixo custo. Testes de componentes ficam como melhoria futura.

## 035 — Biblioteca de componentes própria em `components/ui`
- **Decisão:** 10 componentes genéricos (Button, Input, Select, Textarea, Badge, Modal, Card, Spinner, EmptyState, Toast) escritos à mão, com variantes por props (`variant`, `size`, `tone`, `padding`), tipos derivados dos elementos HTML (`ComponentPropsWithoutRef`) e no máximo ~65 linhas cada. Cores só pelos nomes do tema.
- **Motivo:** evita depender de uma biblioteca de UI para um conjunto pequeno de peças, mantém o bundle leve e deixa cada decisão de design explicável. Input, Select e Textarea compartilham `FormField` (rótulo, erro, dica) e `fieldStyles`, então ficam idênticos.
- **Acessibilidade:** rótulos ligados por `htmlFor`/`useId`, `aria-invalid` e `aria-describedby` nos erros, `role="alert"` para erros, `aria-busy` e rótulo oculto no spinner, `aria-label` nos botões de fechar, anel de foco visível.
- **Verificação:** os componentes foram renderizados em uma galeria temporária (não versionada) nos temas claro e escuro, incluindo modal e toasts.

## 036 — Modal sobre `<dialog>` nativo; Toast com provider
- **Decisão:** `Modal` usa `<dialog>` + `showModal()`, que entrega foco preso, fechamento com Esc e bloqueio do restante da página sem código extra. Notificações usam um `ToastProvider` (contexto) e o hook `useToast()`, com remoção automática em 5 s.
- **Limitação conhecida:** o `<dialog>` fica na camada superior do navegador, acima dos toasts. Convenção do projeto: fechar o modal antes de notificar.
- **Alternativas:** biblioteca de modal (Radix, Headless UI), mais completa porém uma dependência a mais; gerenciar foco e Esc manualmente (propenso a erro).

## 037 — Autenticação no frontend: contexto + cookie, sessão verificada no carregamento
- **Decisão:** `AuthProvider` guarda o usuário logado em memória. Ao abrir ou recarregar a página, consulta `GET /auth/me` para saber se o cookie ainda representa uma sessão válida (enquanto isso, `ProtectedRoute` mostra um spinner em vez de piscar a tela de login). `ProtectedRoute` envolve todas as telas autenticadas; qualquer 401 em rota protegida derruba o usuário ao login (callback do `httpClient`).
- **Motivo:** o token fica num cookie httpOnly, inacessível ao JavaScript, então o front não "sabe" se há sessão sem perguntar à API. Guardar só os dados do usuário (e nunca o token) elimina o risco de vazamento por XSS.
- **Alternativas:** token em `localStorage` (legível por qualquer script da página); Redux/Zustand para o estado de sessão (peso desnecessário para um único valor).

## 038 — Roteamento com React Router e destino pós-login compartilhado
- **Decisão:** React Router v8 com rotas aninhadas (`ProtectedRoute` → `AppLayout` → páginas). Ao ser mandado ao login, o usuário leva em `location.state.from` a página pedida e volta para ela após entrar. O cálculo do destino fica num hook (`useDestinoPosLogin`) usado pelo formulário **e** pela página de login.
- **Por que um hook compartilhado:** o teste de ponta a ponta revelou uma corrida: ao concluir o login, o `LoginPage` (que redireciona quem já está logado) disparava `Navigate` para o dashboard antes do `navigate(destino)` do formulário, e a página pedida se perdia. Com os dois lendo o mesmo destino, o resultado é o mesmo qualquer que seja o primeiro a agir.
- **Pendência:** o link "Solicitações" do cabeçalho leva a "Página não encontrada" até a fase da listagem.

## 039 — Verificação do fluxo de autenticação com navegador real
- **Decisão:** o fluxo foi validado com um script `puppeteer-core` (descartável, fora do repositório) dirigindo o Chrome contra o backend e o frontend reais: 17 verificações (rota protegida, validação, senha errada, login, persistência após recarregar, `/login` estando logado, rota 404, alternância e persistência do tema, logout, deep link, perfil do atendente, ausência de erros no console).
- **Motivo:** testes unitários não pegariam problemas de integração como a corrida da decisão 038.
- **Limitação:** o script não está versionado; transformá-lo em suíte E2E do projeto é uma melhoria futura.

## 040 — Filtros da listagem: estado local, com debounce só na busca
- **Decisão:** o hook `useFiltrosSolicitacoes` mantém dois conjuntos: `filtros` (o que está nos campos agora) e `aplicados` (o que vai para a API). Só o texto da busca passa por debounce de 300 ms; status, categoria e datas aplicam na hora.
- **Motivo:** uma requisição por tecla digitada desperdiça rede e faz a lista "tremer"; já selects e datas são escolhas discretas e o usuário espera resposta imediata. Verificado no navegador: digitar 4 letras gera no máximo 1 requisição.
- **Período invertido:** é detectado no cliente, mostra o aviso no campo e não é enviado (a API responderia 400). Verificado: nenhuma resposta 400 durante o teste.
- **Limitação:** os filtros não ficam na URL, então não sobrevivem a um recarregamento nem podem ser compartilhados por link. Melhoria futura.

## 041 — Busca de dados sem estado de "carregando" sincronizado em efeito
- **Decisão:** `useSolicitacoes` guarda o resultado junto com a "chave" da busca que o gerou (`[status, categoria, busca, de, ate, tentativa]`). `carregando` e `erro` são **derivados** comparando essa chave com a atual. Respostas de buscas obsoletas são descartadas.
- **Motivo:** a primeira versão chamava `setState` de forma síncrona dentro do efeito, e o lint do React avisou (renderização em cascata). Derivar o estado elimina o aviso e o risco de mostrar o resultado de uma busca antiga. Bônus: enquanto a nova busca roda, a lista anterior continua visível e esmaecida, sem piscar.
- **Alternativas:** TanStack Query (cache, retentativas e estados prontos, mas uma dependência a mais para um único fluxo de leitura).

## 042 — Datas e códigos exibidos
- **Decisão:** datas formatadas em pt-BR no fuso `America/Sao_Paulo` (`lib/formatar.ts`), o mesmo usado pelo filtro de período da API (decisão 022); código da solicitação exibido como `#0001`.
- **Motivo:** o dia que o usuário vê na tabela é o mesmo dia que o filtro compara; testado com um horário que é o dia seguinte em UTC mas o mesmo dia em Brasília.

## 043 — Tabela da listagem: rolagem horizontal por enquanto
- **Decisão:** em telas pequenas a tabela rola horizontalmente. A conversão para cartões fica para a fase de responsividade (14.2).
- **Motivo:** priorizar o fluxo funcional; verificado em 390 px que nada quebra, mas a leitura não é ideal.
- **Também:** o script `check:cores` passou a ignorar comentários e arquivos de teste, após acusar `#0007` (exemplo de código) como cor hexadecimal.

## 044 — Formulário: validação local espelhando a API + erros do servidor por campo
- **Decisão:** `utils/validacao.ts` repete as regras da API (título 3–150, descrição 1–5000, categoria obrigatória) para dar resposta imediata, com testes unitários. Se a API ainda assim devolver 400, cada `detalhes[].campo` é mostrado no campo correspondente; erros sem campo (rede, 5xx) aparecem num aviso geral. O erro de um campo some assim que o usuário o edita.
- **Motivo:** validar só no servidor deixa o usuário esperando um round-trip; validar só no cliente é contornável. As duas camadas se complementam e a API continua sendo a autoridade.
- **Detalhes:** contador de caracteres na descrição, `maxLength` nos campos, botão com `loading` bloqueando envio duplicado, uma mesma tela de formulário para criar e editar.

## 045 — Permissões na interface espelham a API (que continua sendo a autoridade)
- **Decisão:** `utils/permissoes.ts` decide o que mostrar: Editar/Excluir só para o autor de uma solicitação aberta; "Atendimento" só para o atendente, com apenas as transições válidas do status atual. O diálogo de exclusão nem é renderizado para quem não pode excluir.
- **Motivo:** não oferecer botões que resultariam em erro. Se alguém forçar a URL (`/solicitacoes/2/editar`), a tela mostra "não pode ser editada" e, mesmo que enviasse a requisição, a API responderia 403/404/409. Verificado no navegador com os três perfis de situação.

## 046 — Ações com erro: toast com a mensagem da API e recarga da solicitação
- **Decisão:** excluir e mudar status ficam em hooks (`useAcoesDetalhes`). Em caso de falha, o hook mostra um toast com a mensagem da API e recarrega a solicitação, pois o motivo costuma ser que ela mudou depois que a tela abriu. A exclusão fecha o modal **antes** do toast de erro (limitação do `<dialog>`, decisão 036).
- **Verificado:** cenário real em que o atendente assume a solicitação enquanto a autora está na tela de detalhes; ao confirmar a exclusão, a API responde 409, o modal fecha, o toast aparece e a tela passa a refletir o novo estado sem Editar/Excluir.

## 047 — `LinkButton`: navegação com aparência de botão sem aninhar elementos interativos
- **Decisão:** componente `LinkButton` (renderiza `<a>`) compartilha o visual com `Button` via `buttonStyles.ts`. Substituiu `<Link><Button/></Link>`, que aninha um botão dentro de um link (HTML inválido e problemático para teclado e leitores de tela).
- **Motivo:** corrigir um erro de acessibilidade que eu mesmo havia introduzido na listagem, sem duplicar as classes de estilo.

## 048 — Hook genérico `useConsulta` para telas de leitura
- **Decisão:** a lógica de busca (chave da consulta, resultado marcado com a chave, `carregando`/`erro` derivados, descarte de respostas obsoletas, `recarregar`, `substituir`) foi extraída para `hooks/useConsulta.ts`. `useSolicitacoes`, `useSolicitacao` e `useDashboard` viraram wrappers de poucas linhas.
- **Motivo:** o padrão já existia em dois hooks e o dashboard seria o terceiro; centralizar elimina duplicação e deixa o tratamento de corridas num único lugar. A refatoração foi feita com as suítes de ponta a ponta já existentes como rede de segurança: nenhuma regressão (auth 17/17, listagem 19/19, CRUD 29/29).
- **Opções:** `manterAnterior` (lista esmaecida em vez de piscar) e `mensagemErro` para falhas que não vêm da API.

## 049 — Dashboard: cartões, barra de distribuição e acessibilidade
- **Decisão:** quatro cartões (total, abertas, em atendimento, concluídas) e uma barra empilhada com a proporção de cada status. Os números vêm de uma única chamada a `GET /dashboard`, já filtrada por perfil pela API (solicitante vê só os seus; atendente vê o global).
- **Acessibilidade:** a informação não depende só de cor — a legenda traz nome, quantidade e porcentagem, e a barra tem `role="img"` com descrição textual para leitores de tela. As cores vêm dos mesmos tokens do tema (`bg-status-*`), já validados quanto a contraste.
- **Estados:** carregando, erro com "Tentar novamente" e, quando não há nenhuma solicitação, uma mensagem no lugar da barra (que ficaria sem significado).

## 050 — Sair voluntariamente não guarda a tela anterior
- **Decisão:** o `AuthProvider` expõe `saiuVoluntariamente`. O `ProtectedRoute` só guarda a página de origem (`from`) quando o motivo do redirecionamento é um link aberto sem login ou uma sessão expirada; depois de um clique em "Sair" o próximo login cai no dashboard.
- **Como foi descoberto:** o teste de ponta a ponta mostrou que, ao sair em `/solicitacoes` e entrar como outro usuário, o login levava de volta a `/solicitacoes`. Pior seria sair em `/solicitacoes/4` e o próximo usuário cair numa página de contexto alheio. A API já impediria o acesso indevido, mas a experiência estava errada.

## 051 — Rate limit do login conta apenas tentativas falhas
- **Decisão:** `skipSuccessfulRequests: true` no limitador de `POST /auth/login`.
- **Motivo:** o limite (10 por IP a cada 15 min) contava também os logins corretos. Num escritório, onde muitos colaboradores saem do mesmo IP, 10 pessoas entrando normalmente bloqueariam todas as outras. O alvo da proteção é a adivinhação de senha, que se manifesta em falhas.
- **Verificado manualmente:** 12 logins corretos seguidos passam; na 11ª senha errada a API responde 429. O comportamento ainda não tem teste automatizado, pois o limitador é desligado em `NODE_ENV=test`.

## 052 — Docker Compose com três serviços e inicialização do banco pelos próprios scripts SQL
- **Decisão:** `docker-compose.yml` sobe `db` (PostgreSQL 16), `backend` (Node 22) e `frontend` (nginx). O banco monta `database/schema.sql` e `database/seed.sql` em `/docker-entrypoint-initdb.d/`, que o Postgres executa em ordem na **primeira** criação do volume. `depends_on` com `condition: service_healthy` garante a ordem db → backend → frontend, e os três têm healthcheck.
- **Motivo:** os mesmos scripts que o enunciado pede (criação das tabelas e dados de teste) são os que realmente inicializam o ambiente, sem um passo manual. Os dados persistem em um volume nomeado: `docker compose down` mantém; `down -v` volta ao estado inicial. Verificado em ambos os casos.
- **Executar sem adaptações:** todos os valores têm padrão de demonstração (senha do banco, `JWT_SECRET`), então `docker compose up --build` funciona num clone limpo, sem `.env`. Medido: ~40 s do clone ao sistema saudável. O `.env.example` documenta como trocar.
- **Atenção:** os segredos padrão servem apenas para demonstração; em qualquer ambiente real devem ser substituídos (`openssl rand -hex 32`). O banco não é publicado no host por padrão (evita conflito de porta e exposição desnecessária).

## 053 — nginx como proxy reverso: uma única origem para o navegador
- **Decisão:** o frontend é servido pelo nginx, que também repassa `/api/*` ao backend (removendo o prefixo). O front é compilado com `VITE_API_URL=/api`.
- **Motivo:** com uma só origem não há CORS, o cookie de sessão `SameSite=Lax` funciona sem ajustes e o sistema responde igual por `localhost`, IP da rede ou domínio. Em desenvolvimento (Vite em :5173 + API em :3000) continua valendo o CORS configurado.
- **Detalhes:** fallback de SPA (`try_files … /index.html`) para URLs profundas como `/solicitacoes/4`; assets com hash recebem cache de 1 ano e `immutable`; o `index.html` fica com `no-cache` para novas versões chegarem; cabeçalhos `X-Content-Type-Options`, `X-Frame-Options` e `Referrer-Policy` (incluídos em cada `location`, pois o nginx não herda `add_header`).
- **Não feito (produção):** Content-Security-Policy e HTTPS. A CSP exigiria tratar o script inline do tema (nonce ou hash); o HTTPS seria terminado por um balanceador/proxy externo, ligando `COOKIE_SECURE=true`.

## 054 — `TRUST_PROXY` para o rate limit enxergar o cliente real
- **Decisão:** variável `TRUST_PROXY` (padrão `false`; `true` no compose) liga `app.set('trust proxy', 1)`.
- **Motivo:** atrás do nginx todas as requisições chegam do IP do proxy; sem isso o limite de tentativas de login seria compartilhado por todos os usuários. Com 1 salto confiável, o Express usa o IP que o **nginx** viu, e não o que o cliente declara.
- **Verificado:** enviando 11 senhas erradas com um `X-Forwarded-For` diferente a cada tentativa, a 11ª recebeu 429, ou seja, forjar o cabeçalho não contorna o limite.

## 055 — Imagens multi-stage enxutas e sem privilégios de root
- **Decisão:** backend e frontend usam build em dois estágios. O backend final contém só dependências de produção e o JS compilado, e roda como o usuário `node`. O frontend final é apenas nginx + arquivos estáticos (sem Node). `.dockerignore` evita copiar `node_modules`, `.env` e testes.
- **Motivo:** menor superfície de ataque e imagens menores. `bcryptjs` (decisão 004) evitou a necessidade de compilar módulos nativos nas imagens Alpine.
