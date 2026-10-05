import { beforeEach, describe, expect, it } from 'vitest';
import { app, loginComo, request, resetarBanco } from './helpers';

describe('autenticação', () => {
  beforeEach(resetarBanco);

  describe('POST /auth/login', () => {
    it('autentica com credenciais corretas e define o cookie de sessão httpOnly', async () => {
      const res = await request(app).post('/auth/login').send({ usuario: 'maria', senha: 'senha123' });

      expect(res.status).toBe(200);
      expect(res.body.usuario).toEqual({ id: 2, nome: 'Maria Souza', usuario: 'maria', perfil: 'solicitante' });
      const cookie = String(res.headers['set-cookie']);
      expect(cookie).toContain('token=');
      expect(cookie).toContain('HttpOnly');
    });

    it('nunca devolve a senha nem o hash na resposta', async () => {
      const res = await request(app).post('/auth/login').send({ usuario: 'maria', senha: 'senha123' });
      expect(JSON.stringify(res.body)).not.toMatch(/senha|hash|\$2[aby]\$/i);
    });

    it('recusa senha errada com 401', async () => {
      const res = await request(app).post('/auth/login').send({ usuario: 'maria', senha: 'errada' });
      expect(res.status).toBe(401);
      expect(res.body.erro).toBe('Usuário ou senha inválidos');
      expect(res.headers['set-cookie']).toBeUndefined();
    });

    it('recusa usuário inexistente com a MESMA mensagem da senha errada', async () => {
      const inexistente = await request(app).post('/auth/login').send({ usuario: 'fantasma', senha: 'qualquer' });
      const senhaErrada = await request(app).post('/auth/login').send({ usuario: 'maria', senha: 'errada' });

      expect(inexistente.status).toBe(401);
      expect(inexistente.body).toEqual(senhaErrada.body);
    });

    it('recusa corpo sem os campos obrigatórios com 400 e detalhes por campo', async () => {
      const res = await request(app).post('/auth/login').send({});
      expect(res.status).toBe(400);
      expect(res.body.detalhes.map((d: { campo: string }) => d.campo)).toEqual(['usuario', 'senha']);
    });
  });

  describe('sessão', () => {
    it('GET /auth/me devolve o usuário logado', async () => {
      const agente = await loginComo('atendente');
      const res = await agente.get('/auth/me');
      expect(res.status).toBe(200);
      expect(res.body.usuario).toMatchObject({ usuario: 'atendente', perfil: 'atendente' });
    });

    it('POST /auth/logout encerra a sessão', async () => {
      const agente = await loginComo('maria');
      expect((await agente.get('/auth/me')).status).toBe(200);

      const logout = await agente.post('/auth/logout');
      expect(logout.status).toBe(204);

      expect((await agente.get('/auth/me')).status).toBe(401);
    });

    it('recusa um token adulterado', async () => {
      const res = await request(app).get('/auth/me').set('Cookie', 'token=abc.def.ghi');
      expect(res.status).toBe(401);
    });

    it('recusa token válido de um usuário que foi removido do banco', async () => {
      const agente = await loginComo('joao');
      await import('../src/config/database').then(({ pool }) => pool.query(`
        DELETE FROM historico_status WHERE usuario_id = 3 OR solicitacao_id IN (SELECT id FROM solicitacoes WHERE usuario_id = 3);
        DELETE FROM solicitacoes WHERE usuario_id = 3;
        DELETE FROM usuarios WHERE id = 3`));

      const res = await agente.get('/auth/me');
      expect(res.status).toBe(401);
    });
  });
});
