import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/database';
import { loginComo, resetarBanco } from './helpers';

// Excluir não apaga a linha: marca `excluido_em`. A solicitação some de todas as telas e consultas, mas fica no banco
// (trilha de auditoria). Seed: 9 = maria, aberta, "Nota fiscal não localizada".
const ID = 9;

async function linhaNoBanco(id: number) {
  const { rows } = await pool.query('SELECT id, titulo, status, usuario_id, excluido_em FROM solicitacoes WHERE id = $1', [id]);
  return rows[0] as { id: number; titulo: string; status: string; usuario_id: number; excluido_em: Date | null } | undefined;
}

describe('exclusão lógica', () => {
  beforeEach(resetarBanco);

  it('a linha continua no banco, marcada com a data da exclusão', async () => {
    const maria = await loginComo('maria');
    expect((await maria.delete(`/solicitacoes/${ID}`)).status).toBe(204);

    const linha = await linhaNoBanco(ID);
    expect(linha).toBeDefined(); // não foi apagada
    expect(linha?.excluido_em).toBeInstanceOf(Date);
    expect(linha?.titulo).toBe('Nota fiscal não localizada');
    expect(linha?.usuario_id).toBe(2);
  });

  it('solicitações ativas têm excluido_em nulo', async () => {
    expect((await linhaNoBanco(1))?.excluido_em).toBeNull();
  });

  describe('depois de excluída, a solicitação desaparece de tudo', () => {
    beforeEach(async () => {
      const maria = await loginComo('maria');
      await maria.delete(`/solicitacoes/${ID}`);
    });

    it('detalhes: 404 para o autor e para o atendente', async () => {
      const maria = await loginComo('maria');
      const atendente = await loginComo('atendente');
      expect((await maria.get(`/solicitacoes/${ID}`)).status).toBe(404);
      expect((await atendente.get(`/solicitacoes/${ID}`)).status).toBe(404);
    });

    it('listagem e total de itens (do autor e do atendente)', async () => {
      const maria = await loginComo('maria');
      const atendente = await loginComo('atendente');
      const dela = await maria.get('/solicitacoes');
      expect(dela.body.solicitacoes.map((s: { id: number }) => s.id)).toEqual([1, 2, 3, 8]);
      expect(dela.body.paginacao.total).toBe(4);
      const geral = await atendente.get('/solicitacoes');
      expect(geral.body.solicitacoes.map((s: { id: number }) => s.id)).not.toContain(ID);
      expect(geral.body.paginacao.total).toBe(9);
    });

    it('busca por texto não a encontra', async () => {
      const atendente = await loginComo('atendente');
      const res = await atendente.get('/solicitacoes').query({ busca: 'nota fiscal' });
      expect(res.body.solicitacoes).toEqual([]);
      expect(res.body.paginacao.total).toBe(0);
    });

    it('dashboard não a conta (nem no total, nem em "abertas")', async () => {
      const maria = await loginComo('maria');
      const atendente = await loginComo('atendente');
      expect((await maria.get('/dashboard')).body).toEqual({ total: 4, abertas: 1, emAtendimento: 1, concluidas: 2 });
      expect((await atendente.get('/dashboard')).body).toEqual({ total: 9, abertas: 3, emAtendimento: 3, concluidas: 3 });
    });

    it('não pode mais ser editada, excluída de novo nem ter o status alterado (404)', async () => {
      const maria = await loginComo('maria');
      const atendente = await loginComo('atendente');
      expect((await maria.put(`/solicitacoes/${ID}`).send({ titulo: 'Título novo', descricao: 'x', categoria: 'TI' })).status).toBe(404);
      expect((await maria.delete(`/solicitacoes/${ID}`)).status).toBe(404);
      expect((await atendente.patch(`/solicitacoes/${ID}/status`).send({ status: 'em_atendimento' })).status).toBe(404);
      // e nada disso mexeu na linha
      const linha = await linhaNoBanco(ID);
      expect(linha?.titulo).toBe('Nota fiscal não localizada');
      expect(linha?.status).toBe('aberto');
    });
  });

  it('o código excluído não é reaproveitado: uma nova solicitação recebe outro código', async () => {
    const maria = await loginComo('maria');
    await maria.delete(`/solicitacoes/${ID}`);
    const nova = await maria.post('/solicitacoes').send({ titulo: 'Nova depois da exclusão', descricao: 'x', categoria: 'TI' });
    expect(nova.body.solicitacao.id).toBeGreaterThan(10);
  });

  it('as regras de quem pode excluir continuam valendo (outro usuário: 404; não aberta: 409)', async () => {
    const maria = await loginComo('maria');
    const joao = await loginComo('joao');
    expect((await joao.delete('/solicitacoes/1')).status).toBe(404);
    expect((await maria.delete('/solicitacoes/2')).status).toBe(409);
    expect((await linhaNoBanco(1))?.excluido_em).toBeNull();
    expect((await linhaNoBanco(2))?.excluido_em).toBeNull();
  });
});
