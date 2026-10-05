# Dicionário de Dados

Banco: **PostgreSQL 16**. Estrutura criada por `schema.sql`; dados de demonstração em `seed.sql`.

## Relacionamento

```
usuarios (1) ────< solicitacoes (1) ────< historico_status (N)
   id  ◄──────────  usuario_id          id  ◄────────  solicitacao_id
   id  ◄──────────────────────────────────────────────  usuario_id
```

Um usuário pode abrir várias solicitações; cada solicitação pertence a exatamente um usuário e tem vários eventos de
histórico (um de abertura e um por mudança de status), cada um feito por um usuário.

## Tabela `usuarios`

Pessoas que acessam o sistema.

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `id` | SERIAL (PK) | sim | automático | Identificador do usuário |
| `nome` | VARCHAR(100) | sim | — | Nome para exibição |
| `usuario` | VARCHAR(50) | sim | — | Login. Único (`UNIQUE`) |
| `senha_hash` | VARCHAR(100) | sim | — | Senha criptografada com bcrypt. Nunca guarda texto puro |
| `perfil` | VARCHAR(20) | sim | `solicitante` | Papel no sistema: `solicitante` ou `atendente` |
| `criado_em` | TIMESTAMPTZ | sim | `NOW()` | Data e hora de criação do usuário |

**Regras:** `perfil` só aceita `solicitante` ou `atendente` (CHECK `usuarios_perfil_valido`).

## Tabela `solicitacoes`

Demandas internas registradas pelos colaboradores.

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `id` | SERIAL (PK) | sim | automático | Código da solicitação |
| `titulo` | VARCHAR(150) | sim | — | Título resumido |
| `descricao` | TEXT | sim | — | Descrição detalhada |
| `categoria` | VARCHAR(20) | sim | — | `TI`, `RH`, `Compras`, `Financeiro` ou `Infraestrutura` |
| `status` | VARCHAR(20) | sim | `aberto` | `aberto`, `em_atendimento` ou `concluido` |
| `criado_em` | TIMESTAMPTZ | sim | `NOW()` | Data de abertura (automática) |
| `atualizado_em` | TIMESTAMPTZ | sim | `NOW()` | Última alteração. A aplicação atualiza a cada edição ou mudança de status |
| `excluido_em` | TIMESTAMPTZ | não | `NULL` | **Exclusão lógica.** `NULL` = solicitação ativa; preenchido = excluída (ver abaixo) |
| `usuario_id` | INTEGER (FK) | sim | — | Solicitante. Referencia `usuarios.id` |

**Regras:**
- `categoria` restrita aos 5 valores (CHECK `solicitacoes_categoria_valida`).
- `status` restrito aos 3 valores (CHECK `solicitacoes_status_valido`).
- `usuario_id` precisa existir em `usuarios`; o banco recusa referências inválidas.

## Tabela `historico_status`

Trilha de auditoria dos status: **um registro para a abertura e um para cada mudança**, com quem fez e quando.

| Coluna | Tipo | Obrigatório | Padrão | Descrição |
|---|---|---|---|---|
| `id` | SERIAL (PK) | sim | automático | Identificador do evento |
| `solicitacao_id` | INTEGER (FK) | sim | — | Solicitação à qual o evento pertence (`solicitacoes.id`) |
| `status_anterior` | VARCHAR(20) | não | — | Status antes da mudança. `NULL` no evento de abertura (não havia status antes) |
| `status_novo` | VARCHAR(20) | sim | — | Status depois da mudança: `aberto`, `em_atendimento` ou `concluido` |
| `usuario_id` | INTEGER (FK) | sim | — | Quem abriu a solicitação ou mudou o status (`usuarios.id`) |
| `criado_em` | TIMESTAMPTZ | sim | `NOW()` | Quando o evento ocorreu |

**Regras:**
- `status_anterior` (quando houver) e `status_novo` só aceitam os três status válidos (CHECK).
- O evento é gravado **na mesma transação** da operação que o originou: se o registro do histórico falhar, a abertura ou a
  mudança de status também é desfeita (nunca existe uma solicitação sem o evento de abertura, nem um status alterado sem registro).
- Editar título, descrição ou categoria **não** gera evento: o histórico é só de status.
- Os eventos permanecem no banco mesmo que a solicitação seja excluída logicamente; a API deixa de exibi-los.
- Índice `idx_historico_status_solicitacao (solicitacao_id, criado_em)`: a tela de detalhes lê os eventos de uma solicitação em ordem cronológica.

### Exclusão lógica

Excluir uma solicitação **não apaga a linha**: a API preenche `excluido_em` com a data e hora da exclusão. A partir daí ela
deixa de aparecer em qualquer consulta da aplicação (listagem, detalhes, busca, contagens do dashboard e totais da
paginação), e não pode mais ser editada, excluída de novo nem ter o status alterado (a API responde 404). O registro
permanece no banco como trilha de auditoria, e o código (`id`) nunca é reaproveitado.

Para consultar as excluídas diretamente no banco: `SELECT * FROM solicitacoes WHERE excluido_em IS NOT NULL;`

## Índices

| Índice | Coluna | Uso |
|---|---|---|
| `idx_solicitacoes_status` | `status` | Filtro por status e contagens do dashboard |
| `idx_solicitacoes_categoria` | `categoria` | Filtro por categoria |
| `idx_solicitacoes_criado_em` | `criado_em` | Filtro por período e ordenação |
| `idx_solicitacoes_usuario_id` | `usuario_id` | Listar as solicitações de um usuário |
| `idx_historico_status_solicitacao` | `solicitacao_id`, `criado_em` | Montar a linha do tempo de uma solicitação |

## Regras de negócio aplicadas pela API (não pelo banco)

- Só é possível **editar ou excluir** uma solicitação com status `aberto`, e apenas pelo autor. A exclusão é lógica (preenche `excluido_em`).
- Só o perfil `atendente` altera o status; cada mudança é registrada em `historico_status`.
- O solicitante enxerga apenas as próprias solicitações; o atendente enxerga todas.
- `status` inicial e `usuario_id` são definidos pelo servidor, nunca enviados pelo cliente.
