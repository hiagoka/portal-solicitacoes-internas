# Dicionário de Dados

Banco: **PostgreSQL 16**. Estrutura criada por `schema.sql`; dados de demonstração em `seed.sql`.

## Relacionamento

```
usuarios (1) ────< solicitacoes (N)
   id  ◄──────────  usuario_id
```

Um usuário pode abrir várias solicitações; cada solicitação pertence a exatamente um usuário.

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
| `usuario_id` | INTEGER (FK) | sim | — | Solicitante. Referencia `usuarios.id` |

**Regras:**
- `categoria` restrita aos 5 valores (CHECK `solicitacoes_categoria_valida`).
- `status` restrito aos 3 valores (CHECK `solicitacoes_status_valido`).
- `usuario_id` precisa existir em `usuarios`; o banco recusa referências inválidas.

## Índices

| Índice | Coluna | Uso |
|---|---|---|
| `idx_solicitacoes_status` | `status` | Filtro por status e contagens do dashboard |
| `idx_solicitacoes_categoria` | `categoria` | Filtro por categoria |
| `idx_solicitacoes_criado_em` | `criado_em` | Filtro por período e ordenação |
| `idx_solicitacoes_usuario_id` | `usuario_id` | Listar as solicitações de um usuário |

## Regras de negócio aplicadas pela API (não pelo banco)

- Só é possível **editar ou excluir** uma solicitação com status `aberto`, e apenas pelo autor.
- Só o perfil `atendente` altera o status.
- O solicitante enxerga apenas as próprias solicitações; o atendente enxerga todas.
- `status` inicial e `usuario_id` são definidos pelo servidor, nunca enviados pelo cliente.
