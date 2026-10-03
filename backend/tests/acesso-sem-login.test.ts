import { beforeEach, describe, expect, it } from 'vitest';
import { app, request, resetarBanco } from './helpers';

// Toda rota da API (exceto login e health) precisa de autenticação.
const rotasProtegidas: Array<[metodo: 'get' | 'post' | 'put' | 'patch' | 'delete', caminho: string]> = [
  ['get', '/auth/me'],
  ['get', '/solicitacoes'],
  ['post', '/solicitacoes'],
  ['get', '/solicitacoes/1'],
  ['put', '/solicitacoes/1'],
  ['delete', '/solicitacoes/1'],
  ['patch', '/solicitacoes/1/status'],
  ['get', '/dashboard'],
];

describe('acesso sem autenticação', () => {
  beforeEach(resetarBanco);

  it.each(rotasProtegidas)('%s %s responde 401', async (metodo, caminho) => {
    const res = await request(app)[metodo](caminho).send({});
    expect(res.status).toBe(401);
    expect(res.body.erro).toBeTruthy();
  });

  it('rotas públicas continuam acessíveis', async () => {
    expect((await request(app).get('/health')).status).toBe(200);
    expect((await request(app).post('/auth/login').send({})).status).toBe(400); // chega à validação, não ao 401
  });
});
