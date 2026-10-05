import express from 'express';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/database';
import { registrarRequisicao } from '../src/middlewares/registrarRequisicao';
import { app, loginComo, resetarBanco } from './helpers';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

describe('ID da requisição', () => {
  it('toda resposta traz um X-Request-Id único (inclusive erros 404 e 401)', async () => {
    const [a, b, c] = await Promise.all([request(app).get('/health'), request(app).get('/nao-existe'), request(app).get('/auth/me')]);
    for (const res of [a, b, c]) expect(res.headers['x-request-id']).toMatch(UUID);
    expect(new Set([a, b, c].map((r) => r.headers['x-request-id'])).size).toBe(3);
  });

  it('aproveita o ID enviado pelo cliente (para rastrear a mesma requisição de ponta a ponta) se ele for seguro', async () => {
    const res = await request(app).get('/health').set('X-Request-Id', 'meu-id_123.abc');
    expect(res.headers['x-request-id']).toBe('meu-id_123.abc');
  });

  it.each([['longo demais', 'a'.repeat(200)], ['com espaços e símbolos', 'id com espaço; <script>'], ['com quebra de linha', 'abc%0Adef']])(
    'descarta ID enviado pelo cliente que é %s (evita injeção em logs) e gera um novo',
    async (_nome, valor) => {
      const res = await request(app).get('/health').set('X-Request-Id', valor);
      expect(res.headers['x-request-id']).toMatch(UUID);
    },
  );

  describe('erro 500', () => {
    beforeEach(resetarBanco);

    it('o corpo traz o mesmo ID do cabeçalho, para o usuário informar ao suporte sem expor detalhes internos', async () => {
      const maria = await loginComo('maria');
      await pool.query('ALTER TABLE solicitacoes RENAME TO solicitacoes_quebrada');
      try {
        const res = await maria.get('/solicitacoes');
        expect(res.status).toBe(500);
        expect(res.body.erro).toBe('Erro interno do servidor');
        expect(res.body.idRequisicao).toBe(res.headers['x-request-id']);
        expect(JSON.stringify(res.body)).not.toMatch(/relation|solicitacoes|SELECT/i); // nada de SQL nem nome de tabela
      } finally {
        await pool.query('ALTER TABLE solicitacoes_quebrada RENAME TO solicitacoes');
      }
    });
  });
});

describe('log estruturado por requisição', () => {
  function appComLog(escrever: (linha: string) => void) {
    const mini = express();
    mini.use(registrarRequisicao(escrever));
    mini.get('/recurso/:id', (_req, res) => res.status(201).json({ ok: true }));
    return mini;
  }

  it('escreve UMA linha JSON por requisição, ao terminar, com id, método, rota, status e duração', async () => {
    const linhas: string[] = [];
    const res = await request(appComLog((l) => linhas.push(l))).get('/recurso/7').set('X-Request-Id', 'abc-1');
    expect(res.status).toBe(201);
    expect(linhas).toHaveLength(1);
    const registro = JSON.parse(linhas[0]);
    expect(registro).toMatchObject({ nivel: 'info', id: 'abc-1', metodo: 'GET', rota: '/recurso/7', status: 201 });
    expect(registro.duracaoMs).toBeGreaterThanOrEqual(0);
  });

  it('NUNCA registra a query string (pode ter dados pessoais), cookies, corpo nem cabeçalhos', async () => {
    const linhas: string[] = [];
    await request(appComLog((l) => linhas.push(l)))
      .get('/recurso/7?busca=dado-pessoal&cpf=123')
      .set('Cookie', 'token=segredo-da-sessao')
      .set('Authorization', 'Bearer outro-segredo');
    const linha = linhas.join('');
    expect(linha).not.toMatch(/dado-pessoal|cpf|segredo-da-sessao|outro-segredo|token=/);
    expect(JSON.parse(linha).rota).toBe('/recurso/7');
  });
});

describe('cabeçalhos de segurança da API', () => {
  it('não revela a tecnologia (X-Powered-By) e impede o navegador de adivinhar tipos de conteúdo', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('respostas da API não podem ficar em cache (têm dados pessoais e dependem da sessão)', async () => {
    const maria = await loginComo('maria');
    for (const caminho of ['/solicitacoes', '/dashboard', '/auth/me', '/health']) {
      expect((await maria.get(caminho)).headers['cache-control']).toBe('no-store');
    }
    expect((await request(app).get('/auth/me')).headers['cache-control']).toBe('no-store'); // até os erros 401
  });
});
