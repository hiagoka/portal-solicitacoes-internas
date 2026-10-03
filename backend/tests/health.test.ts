import { beforeEach, describe, expect, it } from 'vitest';
import { app, request, resetarBanco } from './helpers';

describe('infraestrutura de testes', () => {
  beforeEach(resetarBanco);

  it('GET /health responde ok com o banco de testes conectado', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('rota inexistente devolve 404 no formato padrão de erro', async () => {
    const res = await request(app).get('/nao-existe');
    expect(res.status).toBe(404);
    expect(res.body.erro).toBe('Rota não encontrada');
  });
});
