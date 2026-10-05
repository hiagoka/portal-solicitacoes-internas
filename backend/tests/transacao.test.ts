import pg from 'pg';
import { beforeEach, describe, expect, it } from 'vitest';
import { pool, transacao } from '../src/config/database';
import { TEST_DATABASE_URL } from './config';
import { resetarBanco } from './helpers';

// `transacao()` empresta uma conexão do pool durante várias consultas seguidas. Enquanto a conexão está emprestada, o pool
// NÃO escuta o evento "error" dela: se o banco a derrubar (reinício, queda de rede), o Node trata o erro como exceção não
// capturada e o processo inteiro da API morre. O Vitest reporta qualquer exceção não capturada como falha da execução.
async function derrubarConexao(pid: number) {
  const admin = new pg.Client({ connectionString: TEST_DATABASE_URL });
  await admin.connect();
  await admin.query('SELECT pg_terminate_backend($1)', [pid]);
  await admin.end();
}

describe('transacao()', () => {
  beforeEach(resetarBanco);

  it('confirma (COMMIT) quando a operação termina bem', async () => {
    await transacao(async (c) => {
      await c.query(`INSERT INTO usuarios (nome, usuario, senha_hash) VALUES ('Tx', 'tx', 'x')`);
    });
    expect((await pool.query(`SELECT count(*)::int AS n FROM usuarios WHERE usuario = 'tx'`)).rows[0].n).toBe(1);
  });

  it('desfaz (ROLLBACK) tudo e devolve o erro original quando a operação falha', async () => {
    const erro = await transacao(async (c) => {
      await c.query(`INSERT INTO usuarios (nome, usuario, senha_hash) VALUES ('Tx', 'tx', 'x')`);
      throw new Error('falha de negócio');
    }).catch((e: Error) => e);
    expect(erro.message).toBe('falha de negócio');
    expect((await pool.query(`SELECT count(*)::int AS n FROM usuarios WHERE usuario = 'tx'`)).rows[0].n).toBe(0);
  });

  describe('quando o banco derruba a conexão com a transação aberta', () => {
    async function transacaoComConexaoDerrubada() {
      return transacao(async (c) => {
        const { rows } = await c.query('SELECT pg_backend_pid() AS pid');
        await derrubarConexao(rows[0].pid);
        await new Promise((resolve) => setTimeout(resolve, 300)); // o erro chega ao cliente enquanto ele está "entre consultas"
        await c.query('SELECT 1');
      });
    }

    it('o processo NÃO cai e o erro devolvido é a CAUSA (a queda da conexão), não os efeitos em cascata', async () => {
      const erro = (await transacaoComConexaoDerrubada().catch((e: Error) => e)) as Error;
      expect(erro).toBeInstanceOf(Error);
      expect(erro.message).toMatch(/terminating connection|Connection terminated/); // a causa
      expect(erro.message).not.toMatch(/not queryable/); // e não "Client has encountered a connection error and is not queryable"
    });

    it('a conexão morta é descartada: as consultas seguintes funcionam e a transação funciona de novo', async () => {
      await transacaoComConexaoDerrubada().catch(() => undefined);
      await new Promise((resolve) => setTimeout(resolve, 300));
      for (let i = 0; i < 5; i++) expect((await pool.query('SELECT 1 AS ok')).rows[0].ok).toBe(1); // nenhuma devolve a conexão quebrada
      await transacao(async (c) => {
        await c.query(`INSERT INTO usuarios (nome, usuario, senha_hash) VALUES ('Depois', 'depois', 'x')`);
      });
      expect((await pool.query(`SELECT count(*)::int AS n FROM usuarios WHERE usuario = 'depois'`)).rows[0].n).toBe(1);
    });
  });
});
