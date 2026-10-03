import { beforeEach, describe, expect, it } from 'vitest';
import { loginComo, resetarBanco } from './helpers';

// Seed (id: dono, categoria, status, criada há quanto tempo):
//  1 maria TI aberto 1d        6 joao Infraestrutura aberto 6h    "Ar-condicionado com vazamento"
//  2 maria TI em_atendimento 3d  7 joao RH concluido 40d
//  3 maria RH concluido 20d      8 maria Compras concluido 30d
//  4 joao Compras aberto 2d      9 maria Financeiro aberto 10d    "Nota fiscal não localizada"
//  5 joao Financeiro em_atend 5d 10 joao Infraestrutura em_atend 8d
// Ordem padrão: mais recentes primeiro.

async function ids(usuario: 'maria' | 'joao' | 'atendente', filtros: Record<string, string> = {}) {
  const agente = await loginComo(usuario);
  const res = await agente.get('/solicitacoes').query(filtros);
  expect(res.status).toBe(200);
  return res.body.solicitacoes.map((s: { id: number }) => s.id) as number[];
}

// Data (AAAA-MM-DD) de N dias atrás, no mesmo fuso usado pelo filtro da API.
function diasAtras(n: number) {
  const data = new Date(Date.now() - n * 86_400_000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(data);
}

describe('GET /solicitacoes — escopo e ordenação', () => {
  beforeEach(resetarBanco);

  it('atendente vê todas, da mais recente para a mais antiga', async () => {
    expect(await ids('atendente')).toEqual([6, 1, 4, 2, 5, 10, 9, 3, 8, 7]);
  });

  it('solicitante vê apenas as próprias', async () => {
    expect(await ids('maria')).toEqual([1, 2, 9, 3, 8]);
    expect(await ids('joao')).toEqual([6, 4, 5, 10, 7]);
  });

  it('cada item traz código, título, categoria, solicitante, data e status', async () => {
    const maria = await loginComo('maria');
    const item = (await maria.get('/solicitacoes')).body.solicitacoes[0];
    expect(item).toEqual({
      id: 1,
      titulo: 'Notebook não liga',
      descricao: expect.any(String),
      categoria: 'TI',
      status: 'aberto',
      criadoEm: expect.any(String),
      atualizadoEm: expect.any(String),
      solicitante: { id: 2, nome: 'Maria Souza' },
    });
  });
});

describe('GET /solicitacoes — filtros', () => {
  beforeEach(resetarBanco);

  it('por status', async () => {
    expect(await ids('atendente', { status: 'aberto' })).toEqual([6, 1, 4, 9]);
    expect(await ids('atendente', { status: 'em_atendimento' })).toEqual([2, 5, 10]);
    expect(await ids('atendente', { status: 'concluido' })).toEqual([3, 8, 7]);
  });

  it('por categoria', async () => {
    expect(await ids('atendente', { categoria: 'RH' })).toEqual([3, 7]);
    expect(await ids('atendente', { categoria: 'Infraestrutura' })).toEqual([6, 10]);
  });

  it('por texto livre no título, sem diferenciar maiúsculas de minúsculas', async () => {
    expect(await ids('atendente', { busca: 'nota' })).toEqual([9]);
    expect(await ids('atendente', { busca: 'NOTA FISCAL' })).toEqual([9]);
    expect(await ids('atendente', { busca: 'ar-cond' })).toEqual([6]);
    expect(await ids('atendente', { busca: 'xyz-nao-existe' })).toEqual([]);
  });

  it('trata % e _ digitados na busca como texto comum, não como curingas', async () => {
    expect(await ids('atendente', { busca: '%' })).toEqual([]);
    expect(await ids('atendente', { busca: '_' })).toEqual([]);
  });

  it('por período: data inicial', async () => {
    expect(await ids('atendente', { de: diasAtras(7) })).toEqual([6, 1, 4, 2, 5]);
  });

  it('por período: data final', async () => {
    expect(await ids('atendente', { ate: diasAtras(25) })).toEqual([8, 7]);
  });

  it('por período: as duas pontas são inclusivas', async () => {
    const dia = diasAtras(20); // só a solicitação 3 foi aberta neste dia
    expect(await ids('atendente', { de: dia, ate: dia })).toEqual([3]);
  });

  it('combina todos os filtros (E lógico)', async () => {
    expect(await ids('atendente', { categoria: 'TI', status: 'aberto' })).toEqual([1]);
    expect(await ids('atendente', { categoria: 'TI', status: 'concluido' })).toEqual([]);
    expect(await ids('atendente', { status: 'concluido', de: diasAtras(35), ate: diasAtras(25) })).toEqual([8]);
  });

  it('os filtros nunca ampliam o escopo do solicitante', async () => {
    // Compras existe para a Maria (8) e para o João (4); a Maria só pode ver a dela.
    expect(await ids('maria', { categoria: 'Compras' })).toEqual([8]);
    expect(await ids('maria', { status: 'aberto' })).toEqual([1, 9]);
  });

  it('campos vazios no formulário são ignorados', async () => {
    expect(await ids('atendente', { status: '', categoria: '', busca: '', de: '', ate: '' })).toHaveLength(10);
  });

  it('SQL injection na busca é tratado como texto', async () => {
    expect(await ids('atendente', { busca: "'; DROP TABLE solicitacoes; --" })).toEqual([]);
    expect(await ids('atendente')).toHaveLength(10); // tabela segue intacta
  });

  it.each([
    ['status inválido', { status: 'xyz' }, 'status'],
    ['categoria inválida', { categoria: 'Marketing' }, 'categoria'],
    ['data em formato errado', { de: '01/10/2026' }, 'de'],
    ['data inexistente', { ate: '2026-02-31' }, 'ate'],
    ['busca acima de 100 caracteres', { busca: 'x'.repeat(101) }, 'busca'],
    ['data inicial maior que a final', { de: '2026-10-10', ate: '2026-10-01' }, 'de'],
  ])('recusa %s com 400', async (_nome, filtros, campo) => {
    const atendente = await loginComo('atendente');
    const res = await atendente.get('/solicitacoes').query(filtros);
    expect(res.status).toBe(400);
    expect(res.body.detalhes.map((d: { campo: string }) => d.campo)).toContain(campo);
  });
});

describe('GET /solicitacoes/:id', () => {
  beforeEach(resetarBanco);

  it('solicitante vê a própria; atendente vê qualquer uma', async () => {
    const maria = await loginComo('maria');
    const atendente = await loginComo('atendente');
    expect((await maria.get('/solicitacoes/1')).body.solicitacao.solicitante.nome).toBe('Maria Souza');
    expect((await atendente.get('/solicitacoes/4')).body.solicitacao.solicitante.nome).toBe('João Lima');
  });

  it('solicitante recebe 404 ao pedir a de outra pessoa', async () => {
    const maria = await loginComo('maria');
    expect((await maria.get('/solicitacoes/4')).status).toBe(404);
  });

  it('recusa código inválido (400) e inexistente (404)', async () => {
    const maria = await loginComo('maria');
    expect((await maria.get('/solicitacoes/abc')).status).toBe(400);
    expect((await maria.get('/solicitacoes/0')).status).toBe(400);
    expect((await maria.get('/solicitacoes/9999')).status).toBe(404);
  });
});
