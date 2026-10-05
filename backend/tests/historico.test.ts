import { beforeEach, describe, expect, it } from 'vitest';
import { pool } from '../src/config/database';
import { loginComo, resetarBanco } from './helpers';

// Seed: 1 (maria, aberto), 2 (maria, em_atendimento), 3 (maria, concluido), 4 (joao, aberto).
// O atendente do seed é "Ana Atendente" (id 1).
type Evento = { id: number; statusAnterior: string | null; statusNovo: string; criadoEm: string; usuario: { id: number; nome: string } };

async function historico(usuario: 'maria' | 'joao' | 'atendente', id: number) {
  const agente = await loginComo(usuario);
  const res = await agente.get(`/solicitacoes/${id}/historico`);
  return { status: res.status, eventos: (res.body.historico ?? []) as Evento[], corpo: res.body };
}
const resumo = (eventos: Evento[]) => eventos.map((e) => `${e.statusAnterior ?? '∅'}→${e.statusNovo} (${e.usuario.nome})`);

describe('GET /solicitacoes/:id/historico', () => {
  beforeEach(resetarBanco);

  it('o seed traz a abertura e as mudanças de cada solicitação, em ordem cronológica', async () => {
    expect(resumo((await historico('maria', 1)).eventos)).toEqual(['∅→aberto (Maria Souza)']);
    expect(resumo((await historico('maria', 2)).eventos)).toEqual(['∅→aberto (Maria Souza)', 'aberto→em_atendimento (Ana Atendente)']);
    expect(resumo((await historico('maria', 3)).eventos)).toEqual([
      '∅→aberto (Maria Souza)',
      'aberto→em_atendimento (Ana Atendente)',
      'em_atendimento→concluido (Ana Atendente)',
    ]);
  });

  it('os eventos vêm em ordem crescente de data e a abertura coincide com a data de abertura', async () => {
    const { eventos } = await historico('maria', 3);
    const datas = eventos.map((e) => new Date(e.criadoEm).getTime());
    expect([...datas].sort((a, b) => a - b)).toEqual(datas);
    const maria = await loginComo('maria');
    const solicitacao = (await maria.get('/solicitacoes/3')).body.solicitacao;
    expect(eventos[0].criadoEm).toBe(solicitacao.criadoEm);
  });

  it('cada evento traz os dados que a tela precisa', async () => {
    const { eventos } = await historico('maria', 2);
    expect(eventos[1]).toEqual({
      id: expect.any(Number),
      statusAnterior: 'aberto',
      statusNovo: 'em_atendimento',
      criadoEm: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/),
      usuario: { id: 1, nome: 'Ana Atendente' },
    });
  });

  describe('visibilidade (a mesma da própria solicitação)', () => {
    it('o atendente vê o histórico de qualquer solicitação', async () => {
      expect((await historico('atendente', 4)).status).toBe(200);
      expect((await historico('atendente', 1)).status).toBe(200);
    });

    it('o solicitante vê só o das próprias; o das de outros responde 404', async () => {
      expect((await historico('maria', 1)).status).toBe(200);
      expect((await historico('maria', 4)).status).toBe(404);
      expect((await historico('joao', 1)).status).toBe(404);
    });

    it.each([['inexistente', '999', 404], ['código inválido', 'abc', 400], ['acima do INTEGER', '3000000000', 400]])(
      'código %s',
      async (_nome, id, esperado) => {
        const maria = await loginComo('maria');
        expect((await maria.get(`/solicitacoes/${id}/historico`)).status).toBe(esperado);
      },
    );
  });
});

describe('o histórico é gravado junto com cada operação', () => {
  beforeEach(resetarBanco);

  it('ao criar: um evento de abertura, feito pelo autor', async () => {
    const maria = await loginComo('maria');
    const id = (await maria.post('/solicitacoes').send({ titulo: 'Nova com histórico', descricao: 'x', categoria: 'TI' })).body.solicitacao.id;
    expect(resumo((await historico('maria', id)).eventos)).toEqual(['∅→aberto (Maria Souza)']);
  });

  it('ao mudar o status: um evento novo, feito por quem mudou, encadeado ao anterior', async () => {
    const atendente = await loginComo('atendente');
    await atendente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' });
    await atendente.patch('/solicitacoes/1/status').send({ status: 'concluido' });
    await atendente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' }); // reabrir

    expect(resumo((await historico('maria', 1)).eventos)).toEqual([
      '∅→aberto (Maria Souza)',
      'aberto→em_atendimento (Ana Atendente)',
      'em_atendimento→concluido (Ana Atendente)',
      'concluido→em_atendimento (Ana Atendente)',
    ]);
  });

  it.each([
    ['mesmo status (409)', 'atendente', 1, { status: 'aberto' }, 409],
    ['transição inválida (409)', 'atendente', 3, { status: 'aberto' }, 409],
    ['status inexistente (400)', 'atendente', 1, { status: 'foo' }, 400],
    ['solicitação inexistente (404)', 'atendente', 999, { status: 'concluido' }, 404],
    ['usuário sem permissão (403)', 'maria', 1, { status: 'em_atendimento' }, 403],
  ] as const)('tentativa recusada não deixa evento: %s', async (_nome, quem, id, corpo, esperado) => {
    const antes = (await pool.query('SELECT count(*)::int AS n FROM historico_status')).rows[0].n;
    const agente = await loginComo(quem);
    expect((await agente.patch(`/solicitacoes/${id}/status`).send(corpo)).status).toBe(esperado);
    const depois = (await pool.query('SELECT count(*)::int AS n FROM historico_status')).rows[0].n;
    expect(depois).toBe(antes);
  });

  it('duas mudanças simultâneas para o mesmo status: uma vence e só ela registra evento', async () => {
    const a = await loginComo('atendente');
    const b = await loginComo('atendente');
    const [r1, r2] = await Promise.all([
      a.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' }),
      b.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' }),
    ]);
    expect([r1.status, r2.status].sort()).toEqual([200, 409]);
    expect((await historico('maria', 1)).eventos).toHaveLength(2); // abertura + uma mudança
  });

  it('editar o conteúdo (título, descrição, categoria) NÃO gera evento: o histórico é só de status', async () => {
    const maria = await loginComo('maria');
    await maria.put('/solicitacoes/1').send({ titulo: 'Título editado', descricao: 'x', categoria: 'RH' });
    expect((await historico('maria', 1)).eventos).toHaveLength(1);
  });
});

describe('histórico e exclusão lógica', () => {
  beforeEach(resetarBanco);

  it('depois de excluída, o histórico some da API (404) mas permanece no banco', async () => {
    const maria = await loginComo('maria');
    await maria.delete('/solicitacoes/9');
    expect((await historico('maria', 9)).status).toBe(404);
    expect((await historico('atendente', 9)).status).toBe(404);
    const { rows } = await pool.query('SELECT count(*)::int AS n FROM historico_status WHERE solicitacao_id = 9');
    expect(rows[0].n).toBeGreaterThanOrEqual(1);
  });
});

// A promessa central: a operação e o seu registro no histórico andam JUNTOS (mesma transação). Para provar,
// quebramos de propósito a gravação do histórico (renomeando a tabela) e conferimos que a operação inteira é desfeita.
describe('atomicidade: se o histórico falhar, a operação inteira é desfeita', () => {
  beforeEach(resetarBanco);

  async function comHistoricoQuebrado(teste: () => Promise<void>) {
    await pool.query('ALTER TABLE historico_status RENAME TO historico_status_quebrado');
    try {
      await teste();
    } finally {
      await pool.query('ALTER TABLE historico_status_quebrado RENAME TO historico_status'); // restaura, aconteça o que acontecer
    }
  }

  it('mudar o status: a solicitação continua com o status antigo', async () => {
    await comHistoricoQuebrado(async () => {
      const atendente = await loginComo('atendente');
      const res = await atendente.patch('/solicitacoes/1/status').send({ status: 'em_atendimento' });
      expect(res.status).toBe(500);
      const { rows } = await pool.query('SELECT status FROM solicitacoes WHERE id = 1');
      expect(rows[0].status).toBe('aberto'); // o UPDATE foi desfeito junto
    });
    expect((await historico('maria', 1)).eventos).toHaveLength(1); // e o histórico segue consistente
  });

  it('criar: a solicitação não fica gravada sem o evento de abertura', async () => {
    const antes = (await pool.query('SELECT count(*)::int AS n FROM solicitacoes')).rows[0].n;
    await comHistoricoQuebrado(async () => {
      const maria = await loginComo('maria');
      const res = await maria.post('/solicitacoes').send({ titulo: 'Não pode ficar órfã', descricao: 'x', categoria: 'TI' });
      expect(res.status).toBe(500);
      const depois = (await pool.query('SELECT count(*)::int AS n FROM solicitacoes')).rows[0].n;
      expect(depois).toBe(antes); // nenhuma solicitação "sem histórico"
    });
  });
});

