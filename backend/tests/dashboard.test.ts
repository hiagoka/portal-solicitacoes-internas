import bcrypt from 'bcryptjs';
import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/database';
import { app, loginComo, request, resetarBanco } from './helpers';

describe('GET /dashboard', () => {
  beforeEach(resetarBanco);

  it('atendente vê os números de todo o sistema', async () => {
    const atendente = await loginComo('atendente');
    const res = await atendente.get('/dashboard');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ total: 10, abertas: 4, emAtendimento: 3, concluidas: 3 });
  });

  it('solicitante vê apenas os números das próprias solicitações', async () => {
    const maria = await loginComo('maria');
    const joao = await loginComo('joao');
    expect((await maria.get('/dashboard')).body).toEqual({ total: 5, abertas: 2, emAtendimento: 1, concluidas: 2 });
    expect((await joao.get('/dashboard')).body).toEqual({ total: 5, abertas: 2, emAtendimento: 2, concluidas: 1 });
  });

  it('o total é a soma dos três status', async () => {
    const atendente = await loginComo('atendente');
    const { total, abertas, emAtendimento, concluidas } = (await atendente.get('/dashboard')).body;
    expect(total).toBe(abertas + emAtendimento + concluidas);
  });

  it('acompanha criação, mudança de status e exclusão', async () => {
    const maria = await loginComo('maria');
    const atendente = await loginComo('atendente');

    await maria.post('/solicitacoes').send({ titulo: 'Nova', descricao: 'x', categoria: 'TI' });
    expect((await maria.get('/dashboard')).body).toMatchObject({ total: 6, abertas: 3 });

    await atendente.patch('/solicitacoes/1/status').send({ status: 'concluido' });
    expect((await maria.get('/dashboard')).body).toEqual({ total: 6, abertas: 2, emAtendimento: 1, concluidas: 3 });

    await maria.delete('/solicitacoes/9');
    expect((await maria.get('/dashboard')).body).toEqual({ total: 5, abertas: 1, emAtendimento: 1, concluidas: 3 });
  });

  it('mostra zero (e não omite o campo) quando não há solicitações em algum status', async () => {
    const hash = await bcrypt.hash('senha123', 4);
    await pool.query(`INSERT INTO usuarios (nome, usuario, senha_hash) VALUES ('Novo Usuário', 'novo', $1)`, [hash]);
    const novo = request.agent(app);
    await novo.post('/auth/login').send({ usuario: 'novo', senha: 'senha123' });

    const res = await novo.get('/dashboard');
    expect(res.body).toEqual({ total: 0, abertas: 0, emAtendimento: 0, concluidas: 0 });
  });
});
