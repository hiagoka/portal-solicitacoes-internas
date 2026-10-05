import pg from 'pg';
import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/database';
import { TEST_DATABASE_URL } from './config';
import { app, request, resetarBanco } from './helpers';

describe('pool de conexões', () => {
  beforeEach(resetarBanco);

  // Cenário real: o banco reinicia, ou a rede derruba uma conexão que estava ociosa no pool.
  // Sem um tratador do evento "error" do pool, o Node trata isso como exceção não capturada e o processo morre.
  it('sobrevive quando o banco encerra as conexões ociosas e volta a atender', async () => {
    expect((await request(app).get('/health')).status).toBe(200); // deixa uma conexão ociosa no pool

    const admin = new pg.Client({ connectionString: TEST_DATABASE_URL });
    await admin.connect();
    await admin.query('SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = current_database() AND pid <> pg_backend_pid()');
    await admin.end();
    await new Promise((resolve) => setTimeout(resolve, 300)); // dá tempo de o erro chegar ao pool

    const resposta = await request(app).get('/health'); // o pool abre uma conexão nova
    expect(resposta.status).toBe(200);
  });

  it('o pool tem tratador de erros (emitir "error" não lança exceção)', () => {
    expect(pool.listenerCount('error')).toBeGreaterThan(0);
    expect(() => pool.emit('error', new Error('falha simulada'))).not.toThrow();
  });
});
