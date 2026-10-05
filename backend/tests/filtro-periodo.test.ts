import { beforeEach, describe, expect, it, vi } from 'vitest';
import { pool } from '../src/config/database';
import { solicitacaoRepository } from '../src/repositories/solicitacaoRepository';
import { resetarBanco } from './helpers';

// O filtro de período compara o DIA no fuso de Brasília (UTC-3, sem horário de verão desde 2019), de forma inclusiva
// nas duas pontas. Estes testes travam esse significado e exigem que a consulta possa usar o índice de criado_em.
async function inserirEm(titulo: string, instanteUtc: string) {
  const { rows } = await pool.query(
    `INSERT INTO solicitacoes (titulo, descricao, categoria, usuario_id, criado_em, atualizado_em)
     VALUES ($1, 'x', 'TI', 2, $2, $2) RETURNING id`,
    [titulo, instanteUtc],
  );
  return rows[0].id as number;
}
const ids = async (filtros: { de?: string; ate?: string }) =>
  (await solicitacaoRepository.listar({ pagina: 1, porPagina: 50, ...filtros })).itens.map((s) => s.id);

describe('filtro de período: o dia é o de Brasília, inclusive nas duas pontas', () => {
  beforeEach(resetarBanco);

  it('23:30 em Brasília (02:30 UTC do dia seguinte) ainda pertence ao dia em Brasília', async () => {
    const id = await inserirEm('tarde da noite', '2031-05-11T02:30:00Z'); // 2031-05-10 23:30 em Brasília
    expect(await ids({ de: '2031-05-10', ate: '2031-05-10' })).toEqual([id]);
    expect(await ids({ de: '2031-05-11', ate: '2031-05-11' })).toEqual([]); // em UTC seria dia 11, mas não é o dia de Brasília
  });

  it('00:30 em Brasília (03:30 UTC) já pertence ao novo dia', async () => {
    const id = await inserirEm('depois da meia-noite', '2031-05-11T03:30:00Z'); // 2031-05-11 00:30 em Brasília
    expect(await ids({ de: '2031-05-11', ate: '2031-05-11' })).toEqual([id]);
    expect(await ids({ de: '2031-05-10', ate: '2031-05-10' })).toEqual([]);
  });

  it('a fronteira exata: 00:00:00 de Brasília entra no dia novo; 23:59:59 do dia anterior não', async () => {
    const meiaNoite = await inserirEm('00:00:00', '2031-05-11T03:00:00Z');
    const umSegundoAntes = await inserirEm('23:59:59', '2031-05-11T02:59:59Z');
    expect(await ids({ de: '2031-05-11' })).toContain(meiaNoite);
    expect(await ids({ de: '2031-05-11' })).not.toContain(umSegundoAntes);
    expect(await ids({ ate: '2031-05-10' })).toContain(umSegundoAntes);
    expect(await ids({ ate: '2031-05-10' })).not.toContain(meiaNoite);
  });

  it('intervalo de vários dias é inclusivo nas duas pontas', async () => {
    const a = await inserirEm('dia 10', '2031-05-10T15:00:00Z');
    const b = await inserirEm('dia 11', '2031-05-11T15:00:00Z');
    const c = await inserirEm('dia 12', '2031-05-12T15:00:00Z');
    expect((await ids({ de: '2031-05-10', ate: '2031-05-12' })).sort()).toEqual([a, b, c].sort());
    expect(await ids({ de: '2031-05-11', ate: '2031-05-11' })).toEqual([b]);
  });
});

describe('o filtro de período pode usar o índice de criado_em', () => {
  beforeEach(resetarBanco);

  // A listagem executa duas consultas: a da página (tem ORDER BY criado_em ... LIMIT, que já percorre o índice de qualquer
  // jeito e por isso esconde o problema) e a CONTAGEM do total, que precisa avaliar o filtro em todas as linhas candidatas.
  // É na contagem que uma comparação com a coluna "embrulhada" numa função obriga a varrer a tabela inteira.
  it('a consulta de contagem usa o índice (e não varre a tabela inteira) numa tabela grande', async () => {
    await pool.query(
      `INSERT INTO solicitacoes (titulo, descricao, categoria, usuario_id, criado_em, atualizado_em)
       SELECT 'carga ' || g, 'x', 'TI', 2, NOW() - (g || ' minutes')::interval, NOW() FROM generate_series(1, 50000) g`,
    );
    await pool.query('ANALYZE solicitacoes');
    // Um dia no meio do período da carga (cerca de 1,4 mil das 50 mil linhas): seletivo o bastante para o índice compensar.
    const dia = (await pool.query(`SELECT to_char((NOW() AT TIME ZONE 'America/Sao_Paulo')::date - 10, 'YYYY-MM-DD') AS d`)).rows[0].d as string;

    // Captura a consulta REAL que o repositório monta e a executa com EXPLAIN, com os mesmos parâmetros.
    const espiao = vi.spyOn(pool, 'query');
    await solicitacaoRepository.listar({ pagina: 1, porPagina: 10, de: dia, ate: dia });
    const contagem = espiao.mock.calls.find((c) => String(c[0]).includes('COUNT(*)'));
    espiao.mockRestore();
    expect(contagem).toBeDefined();

    const { rows } = await pool.query(`EXPLAIN (FORMAT JSON) ${String(contagem![0])}`, contagem![1] as unknown[]);
    const plano = JSON.stringify(rows[0]['QUERY PLAN']);
    expect(plano).not.toContain('"Node Type":"Seq Scan"'); // varrer a tabela inteira
    expect(plano).toMatch(/Index (Only )?Scan|Bitmap (Heap|Index) Scan/); // usa idx_solicitacoes_criado_em
  });
});
