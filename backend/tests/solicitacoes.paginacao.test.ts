import { beforeEach, describe, expect, it } from 'vitest';
import { loginComo, resetarBanco } from './helpers';

// Ordem padrão do seed (mais recentes primeiro):
//  atendente (10): 6, 1, 4, 2, 5, 10, 9, 3, 8, 7        maria (5): 1, 2, 9, 3, 8
type Quem = 'maria' | 'joao' | 'atendente';

// Reaproveita a sessão: cada login faz um bcrypt (~100 ms), e o teste que junta todas as páginas fazia quatro.
const sessoes = new Map<Quem, Awaited<ReturnType<typeof loginComo>>>();

async function pagina(usuario: Quem, params: Record<string, string> = {}) {
  let agente = sessoes.get(usuario);
  if (!agente) sessoes.set(usuario, (agente = await loginComo(usuario)));
  const res = await agente.get('/solicitacoes').query(params);
  return { status: res.status, ids: (res.body.solicitacoes ?? []).map((s: { id: number }) => s.id) as number[], paginacao: res.body.paginacao, body: res.body };
}

describe('GET /solicitacoes — paginação', () => {
  beforeEach(async () => {
    await resetarBanco();
    sessoes.clear(); // o banco foi recriado: as sessões antigas apontam para usuários que já não são os mesmos registros
  });

  it('sem parâmetros: primeira página com 10 por página e os dados de navegação', async () => {
    const { ids, paginacao } = await pagina('atendente');
    expect(ids).toEqual([6, 1, 4, 2, 5, 10, 9, 3, 8, 7]);
    expect(paginacao).toEqual({ pagina: 1, porPagina: 10, total: 10, totalPaginas: 1 });
  });

  it('divide em páginas do tamanho pedido, na ordem correta', async () => {
    expect((await pagina('atendente', { porPagina: '3', pagina: '1' })).ids).toEqual([6, 1, 4]);
    expect((await pagina('atendente', { porPagina: '3', pagina: '2' })).ids).toEqual([2, 5, 10]);
    expect((await pagina('atendente', { porPagina: '3', pagina: '3' })).ids).toEqual([9, 3, 8]);
    const ultima = await pagina('atendente', { porPagina: '3', pagina: '4' });
    expect(ultima.ids).toEqual([7]);
    expect(ultima.paginacao).toEqual({ pagina: 4, porPagina: 3, total: 10, totalPaginas: 4 });
  });

  it('juntar todas as páginas reproduz a lista completa, sem repetir nem perder itens', async () => {
    const todas: number[] = [];
    for (let p = 1; p <= 4; p++) todas.push(...(await pagina('atendente', { porPagina: '3', pagina: String(p) })).ids);
    expect(todas).toEqual([6, 1, 4, 2, 5, 10, 9, 3, 8, 7]);
    expect(new Set(todas).size).toBe(10);
  });

  it('página além da última devolve lista vazia, mas com o total correto', async () => {
    const { ids, paginacao } = await pagina('atendente', { porPagina: '3', pagina: '9' });
    expect(ids).toEqual([]);
    expect(paginacao).toEqual({ pagina: 9, porPagina: 3, total: 10, totalPaginas: 4 });
  });

  it('o total respeita o escopo do solicitante', async () => {
    const p1 = await pagina('maria', { porPagina: '2', pagina: '1' });
    expect(p1.ids).toEqual([1, 2]);
    expect(p1.paginacao).toEqual({ pagina: 1, porPagina: 2, total: 5, totalPaginas: 3 });
    expect((await pagina('maria', { porPagina: '2', pagina: '3' })).ids).toEqual([8]);
    expect((await pagina('joao')).paginacao.total).toBe(5);
  });

  it('o total respeita os filtros aplicados', async () => {
    const p1 = await pagina('atendente', { status: 'aberto', porPagina: '3' });
    expect(p1.ids).toEqual([6, 1, 4]);
    expect(p1.paginacao).toEqual({ pagina: 1, porPagina: 3, total: 4, totalPaginas: 2 });
    expect((await pagina('atendente', { status: 'aberto', porPagina: '3', pagina: '2' })).ids).toEqual([9]);
  });

  it('sem resultados: total 0 e uma única página (nunca "página 1 de 0")', async () => {
    const { ids, paginacao } = await pagina('atendente', { busca: 'zzz-nao-existe' });
    expect(ids).toEqual([]);
    expect(paginacao).toEqual({ pagina: 1, porPagina: 10, total: 0, totalPaginas: 1 });
  });

  it('aceita os extremos permitidos (1 e 50 por página)', async () => {
    expect((await pagina('atendente', { porPagina: '1' })).ids).toEqual([6]);
    expect((await pagina('atendente', { porPagina: '50' })).paginacao.totalPaginas).toBe(1);
  });

  it('campos vazios no formulário usam os padrões', async () => {
    expect((await pagina('atendente', { pagina: '', porPagina: '' })).paginacao).toMatchObject({ pagina: 1, porPagina: 10 });
  });

  it('uma solicitação nova entra no início da primeira página e aumenta o total', async () => {
    const maria = await loginComo('maria');
    const criada = await maria.post('/solicitacoes').send({ titulo: 'Nova para paginar', descricao: 'x', categoria: 'TI' });
    const { ids, paginacao } = await pagina('maria', { porPagina: '2' });
    expect(ids[0]).toBe(criada.body.solicitacao.id);
    expect(paginacao.total).toBe(6);
    expect(paginacao.totalPaginas).toBe(3);
  });

  describe('validação', () => {
    it.each([
      ['página zero', { pagina: '0' }, 'pagina'],
      ['página negativa', { pagina: '-1' }, 'pagina'],
      ['página não numérica', { pagina: 'abc' }, 'pagina'],
      ['página decimal', { pagina: '1.5' }, 'pagina'],
      ['tamanho zero', { porPagina: '0' }, 'porPagina'],
      ['tamanho acima do limite (51)', { porPagina: '51' }, 'porPagina'],
      ['tamanho não numérico', { porPagina: 'muitos' }, 'porPagina'],
      ['tamanho decimal', { porPagina: '2.5' }, 'porPagina'],
    ])('recusa %s com 400', async (_nome, params, campo) => {
      const res = await pagina('atendente', params);
      expect(res.status).toBe(400);
      expect(res.body.detalhes.map((d: { campo: string }) => d.campo)).toContain(campo);
    });
  });
});
