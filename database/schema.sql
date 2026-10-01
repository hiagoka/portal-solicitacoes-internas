-- Portal de Solicitações Internas — criação da estrutura do banco (PostgreSQL)
-- Pode ser executado várias vezes: remove as tabelas antigas antes de recriar.

DROP TABLE IF EXISTS solicitacoes;
DROP TABLE IF EXISTS usuarios;

-- Usuários que acessam o sistema.
CREATE TABLE usuarios (
    id          SERIAL       PRIMARY KEY,                 -- identificador, gerado automaticamente
    nome        VARCHAR(100) NOT NULL,                    -- nome para exibição
    usuario     VARCHAR(50)  NOT NULL UNIQUE,             -- login (não pode repetir)
    senha_hash  VARCHAR(100) NOT NULL,                    -- senha criptografada (bcrypt), nunca em texto puro
    perfil      VARCHAR(20)  NOT NULL DEFAULT 'solicitante',
    criado_em   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT usuarios_perfil_valido CHECK (perfil IN ('solicitante', 'atendente'))
);

-- Solicitações registradas pelos colaboradores.
CREATE TABLE solicitacoes (
    id             SERIAL       PRIMARY KEY,              -- é o "código" da solicitação
    titulo         VARCHAR(150) NOT NULL,
    descricao      TEXT         NOT NULL,
    categoria      VARCHAR(20)  NOT NULL,
    status         VARCHAR(20)  NOT NULL DEFAULT 'aberto',
    criado_em      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),   -- data de abertura (automática)
    atualizado_em  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    usuario_id     INTEGER      NOT NULL REFERENCES usuarios (id),  -- quem abriu (chave estrangeira)

    CONSTRAINT solicitacoes_categoria_valida
        CHECK (categoria IN ('TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura')),
    CONSTRAINT solicitacoes_status_valido
        CHECK (status IN ('aberto', 'em_atendimento', 'concluido'))
);

-- Índices: aceleram as buscas mais comuns (filtros e listagem por usuário).
CREATE INDEX idx_solicitacoes_status     ON solicitacoes (status);
CREATE INDEX idx_solicitacoes_categoria  ON solicitacoes (categoria);
CREATE INDEX idx_solicitacoes_criado_em  ON solicitacoes (criado_em);
CREATE INDEX idx_solicitacoes_usuario_id ON solicitacoes (usuario_id);
