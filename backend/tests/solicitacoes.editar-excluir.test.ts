import { beforeEach, describe, expect, it } from 'vitest';
import { loginComo, resetarBanco } from './helpers';

// IDs do seed.sql:
//  1 (maria, aberto)   2 (maria, em_atendimento)   3 (maria, concluido)   4 (joao, aberto)
const edicao = { titulo: 'Título editado', descricao: 'Descrição editada', categoria: 'RH' };

describe('PUT /solicitacoes/:id', () => {
  beforeEach(resetarBanco);

  it('o autor edita a própria solicitação aberta e atualizado_em muda', async () => {
    const maria = await loginComo('maria');
    const antes = (await maria.get('/solicitacoes/1')).body.solicitacao;

    const res = await maria.put('/solicitacoes/1').send(edicao);

    expect(res.status).toBe(200);
    expect(res.body.solicitacao).toMatchObject({ id: 1, ...edicao, status: 'aberto' });
    expect(res.body.solicitacao.criadoEm).toBe(antes.criadoEm); // data de abertura não muda
    expect(new Date(res.body.solicitacao.atualizadoEm).getTime()).toBeGreaterThan(new Date(antes.atualizadoEm).getTime());
  });

  it.each([
    [2, 'em atendimento'],
    [3, 'concluída'],
  ])('recusa editar a solicitação %i (%s) com 409', async (id) => {
    const maria = await loginComo('maria');
    const res = await maria.put(`/solicitacoes/${id}`).send(edicao);
    expect(res.status).toBe(409);
    expect(res.body.erro).toMatch(/abertas/);
  });

  it('recusa editar a solicitação de outro usuário com 404 (não revela que existe)', async () => {
    const maria = await loginComo('maria');
    const res = await maria.put('/solicitacoes/4').send(edicao);
    expect(res.status).toBe(404);

    // e o conteúdo do João continua intacto
    const joao = await loginComo('joao');
    expect((await joao.get('/solicitacoes/4')).body.solicitacao.titulo).toBe('Compra de cadeiras');
  });

  it('atendente enxerga a solicitação, mas não pode editá-la (403)', async () => {
    const atendente = await loginComo('atendente');
    const res = await atendente.put('/solicitacoes/1').send(edicao);
    expect(res.status).toBe(403);
  });

  it('recusa dados inválidos com 400', async () => {
    const maria = await loginComo('maria');
    const res = await maria.put('/solicitacoes/1').send({ ...edicao, categoria: 'Outra' });
    expect(res.status).toBe(400);
  });

  it('não permite alterar status pela edição', async () => {
    const maria = await loginComo('maria');
    const res = await maria.put('/solicitacoes/1').send({ ...edicao, status: 'concluido' });
    expect(res.status).toBe(200);
    expect(res.body.solicitacao.status).toBe('aberto');
  });

  it('devolve 404 para código inexistente e 400 para código inválido', async () => {
    const maria = await loginComo('maria');
    expect((await maria.put('/solicitacoes/999').send(edicao)).status).toBe(404);
    expect((await maria.put('/solicitacoes/abc').send(edicao)).status).toBe(400);
  });
});

describe('DELETE /solicitacoes/:id', () => {
  beforeEach(resetarBanco);

  it('o autor exclui a própria solicitação aberta', async () => {
    const maria = await loginComo('maria');
    const res = await maria.delete('/solicitacoes/1');

    expect(res.status).toBe(204);
    expect((await maria.get('/solicitacoes/1')).status).toBe(404);
  });

  it.each([2, 3])('recusa excluir a solicitação %i que não está aberta (409)', async (id) => {
    const maria = await loginComo('maria');
    expect((await maria.delete(`/solicitacoes/${id}`)).status).toBe(409);
    expect((await maria.get(`/solicitacoes/${id}`)).status).toBe(200); // continua existindo
  });

  it('recusa excluir a solicitação de outro usuário (404) sem apagá-la', async () => {
    const maria = await loginComo('maria');
    expect((await maria.delete('/solicitacoes/4')).status).toBe(404);

    const joao = await loginComo('joao');
    expect((await joao.get('/solicitacoes/4')).status).toBe(200);
  });

  it('atendente não pode excluir (403)', async () => {
    const atendente = await loginComo('atendente');
    expect((await atendente.delete('/solicitacoes/1')).status).toBe(403);
  });
});
