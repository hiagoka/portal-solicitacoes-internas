import { beforeEach, describe, expect, it } from 'vitest';
import { loginComo, resetarBanco } from './helpers';

// Seed: 1 = aberto (maria), 2 = em_atendimento (maria), 3 = concluido (maria), 4 = aberto (joao)
describe('PATCH /solicitacoes/:id/status', () => {
  beforeEach(resetarBanco);

  describe('permissão', () => {
    it.each(['maria', 'joao'] as const)('o solicitante %s não pode alterar status (403), nem o da própria solicitação', async (quem) => {
      const agente = await loginComo(quem);
      const res = await agente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' });
      expect(res.status).toBe(403);

      const atendente = await loginComo('atendente');
      expect((await atendente.get('/solicitacoes/1')).body.solicitacao.status).toBe('aberto'); // não mudou
    });

    it('o atendente altera o status de solicitações de qualquer usuário', async () => {
      const atendente = await loginComo('atendente');
      expect((await atendente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' })).status).toBe(200);
      expect((await atendente.patch('/solicitacoes/4/status').send({ status: 'em_atendimento' })).status).toBe(200);
    });
  });

  describe('transições', () => {
    it.each([
      [1, 'aberto', 'em_atendimento'],
      [1, 'aberto', 'concluido'],
      [2, 'em_atendimento', 'aberto'],
      [2, 'em_atendimento', 'concluido'],
      [3, 'concluido', 'em_atendimento'],
    ])('permite a solicitação %i ir de %s para %s', async (id, _de, para) => {
      const atendente = await loginComo('atendente');
      const res = await atendente.patch(`/solicitacoes/${id}/status`).send({ status: para });

      expect(res.status).toBe(200);
      expect(res.body.solicitacao.status).toBe(para);
    });

    it('recusa concluído -> aberto (409)', async () => {
      const atendente = await loginComo('atendente');
      const res = await atendente.patch('/solicitacoes/3/status').send({ status: 'aberto' });
      expect(res.status).toBe(409);
      expect(res.body.erro).toMatch(/concluido.*aberto/);
    });

    it.each([
      [1, 'aberto'],
      [2, 'em_atendimento'],
      [3, 'concluido'],
    ])('recusa repetir o status atual da solicitação %i (409)', async (id, atual) => {
      const atendente = await loginComo('atendente');
      const res = await atendente.patch(`/solicitacoes/${id}/status`).send({ status: atual });
      expect(res.status).toBe(409);
    });

    it('atualiza atualizado_em e preserva a data de abertura', async () => {
      const atendente = await loginComo('atendente');
      const antes = (await atendente.get('/solicitacoes/1')).body.solicitacao;
      const depois = (await atendente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' })).body.solicitacao;

      expect(depois.criadoEm).toBe(antes.criadoEm);
      expect(new Date(depois.atualizadoEm).getTime()).toBeGreaterThan(new Date(antes.atualizadoEm).getTime());
    });

    it('duas alterações simultâneas: uma vence e a outra recebe 409', async () => {
      const a = await loginComo('atendente');
      const b = await loginComo('atendente');
      const [r1, r2] = await Promise.all([
        a.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' }),
        b.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' }),
      ]);
      expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    });
  });

  describe('efeito nas demais regras', () => {
    it('depois que o atendente assume, o autor não consegue mais editar nem excluir', async () => {
      const atendente = await loginComo('atendente');
      await atendente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' });

      const maria = await loginComo('maria');
      const dados = { titulo: 'Novo título', descricao: 'x', categoria: 'TI' };
      expect((await maria.put('/solicitacoes/1').send(dados)).status).toBe(409);
      expect((await maria.delete('/solicitacoes/1')).status).toBe(409);
    });

    it('reabrir para "aberto" devolve ao autor o direito de editar', async () => {
      const atendente = await loginComo('atendente');
      await atendente.patch('/solicitacoes/2/status').send({ status: 'aberto' });

      const maria = await loginComo('maria');
      const res = await maria.put('/solicitacoes/2').send({ titulo: 'Reaberta', descricao: 'x', categoria: 'TI' });
      expect(res.status).toBe(200);
    });
  });

  describe('validação', () => {
    it.each([
      ['valor desconhecido', { status: 'foo' }],
      ['corpo vazio', {}],
      ['status nulo', { status: null }],
      ['status numérico', { status: 1 }],
    ])('recusa %s com 400', async (_nome, corpo) => {
      const atendente = await loginComo('atendente');
      const res = await atendente.patch('/solicitacoes/1/status').send(corpo);
      expect(res.status).toBe(400);
      expect(res.body.detalhes[0].campo).toBe('status');
    });

    it('devolve 404 para código inexistente e 400 para código inválido', async () => {
      const atendente = await loginComo('atendente');
      expect((await atendente.patch('/solicitacoes/999/status').send({ status: 'concluido' })).status).toBe(404);
      expect((await atendente.patch('/solicitacoes/abc/status').send({ status: 'concluido' })).status).toBe(400);
    });
  });
});
