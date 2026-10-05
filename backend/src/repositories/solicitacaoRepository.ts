import { query, transacao } from '../config/database';
import type { Solicitacao, Status } from '../types/solicitacao';
import type { FiltrosSolicitacao, SolicitacaoInput } from '../schemas/solicitacao.schema';

// `usuarioId` restringe ao dono (perfil solicitante); os demais campos vêm da query string.
export type FiltrosListagem = FiltrosSolicitacao & { usuarioId?: number };

interface SolicitacaoRow {
  id: number;
  titulo: string;
  descricao: string;
  categoria: Solicitacao['categoria'];
  status: Solicitacao['status'];
  criado_em: Date;
  atualizado_em: Date;
  usuario_id: number;
  solicitante_nome: string;
}

// JOIN com usuarios para trazer o nome do solicitante junto com cada solicitação.
const SELECT_BASE = `
  SELECT s.id, s.titulo, s.descricao, s.categoria, s.status, s.criado_em, s.atualizado_em,
         s.usuario_id, u.nome AS solicitante_nome
  FROM solicitacoes s
  JOIN usuarios u ON u.id = s.usuario_id`;

// Converte a linha do banco (snake_case) para o formato da API (camelCase).
function paraSolicitacao(r: SolicitacaoRow): Solicitacao {
  return {
    id: r.id,
    titulo: r.titulo,
    descricao: r.descricao,
    categoria: r.categoria,
    status: r.status,
    criadoEm: r.criado_em,
    atualizadoEm: r.atualizado_em,
    solicitante: { id: r.usuario_id, nome: r.solicitante_nome },
  };
}

export const solicitacaoRepository = {
  // Status 'aberto' e criado_em vêm dos DEFAULTs do banco.
  // A solicitação e o evento de abertura do histórico são gravados na MESMA transação: nunca existe uma sem a outra.
  async inserir(dados: SolicitacaoInput, usuarioId: number): Promise<number> {
    return transacao(async (cliente) => {
      const { rows } = await cliente.query<{ id: number }>(
        `INSERT INTO solicitacoes (titulo, descricao, categoria, usuario_id)
         VALUES ($1, $2, $3, $4) RETURNING id`,
        [dados.titulo, dados.descricao, dados.categoria, usuarioId],
      );
      await cliente.query(
        `INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, usuario_id)
         VALUES ($1, NULL, 'aberto', $2)`,
        [rows[0].id, usuarioId],
      );
      return rows[0].id;
    });
  },

  async buscarPorId(id: number): Promise<Solicitacao | null> {
    const { rows } = await query<SolicitacaoRow>(`${SELECT_BASE} WHERE s.id = $1 AND s.excluido_em IS NULL`, [id]);
    return rows[0] ? paraSolicitacao(rows[0]) : null;
  },

  // Monta o WHERE dinamicamente, mas só com condições fixas no código; os VALORES sempre vão
  // em parâmetros ($1, $2...). Assim a combinação de filtros é segura contra SQL injection.
  async listar(filtros: FiltrosListagem): Promise<{ itens: Solicitacao[]; total: number }> {
    // Solicitações excluídas (exclusão lógica) não aparecem em nenhuma listagem.
    const condicoes: string[] = ['s.excluido_em IS NULL'];
    const params: unknown[] = [];
    const adicionar = (condicao: string, valor: unknown) => {
      params.push(valor);
      condicoes.push(condicao.replace('?', `$${params.length}`));
    };

    if (filtros.usuarioId !== undefined) adicionar('s.usuario_id = ?', filtros.usuarioId);
    if (filtros.status) adicionar('s.status = ?', filtros.status);
    if (filtros.categoria) adicionar('s.categoria = ?', filtros.categoria);
    // Busca por parte do título, sem diferenciar maiúsculas/minúsculas. Os curingas do LIKE (% e _)
    // digitados pelo usuário são escapados para valerem como texto comum.
    if (filtros.busca) adicionar(`s.titulo ILIKE ? ESCAPE '\\'`, `%${filtros.busca.replace(/[\\%_]/g, '\\$&')}%`);
    // Período inclusivo, comparando o DIA no fuso de Brasília (e não em UTC), para que uma solicitação aberta às 22h não
    // "mude de dia" no filtro. As comparações são feitas com a coluna `criado_em` PURA (convertendo as DATAS informadas em
    // instantes, e não a coluna em data): assim o PostgreSQL pode usar o índice idx_solicitacoes_criado_em. Embrulhar a
    // coluna numa função, `(criado_em AT TIME ZONE ...)::date`, obrigava a varrer a tabela inteira (medido: 43 ms contra
    // 0,7 ms com 100 mil linhas). `de` começa à 00:00 de Brasília; `ate` vai até o fim do dia, ou seja, antes da 00:00 do dia seguinte.
    if (filtros.de) adicionar(`s.criado_em >= (?::date)::timestamp AT TIME ZONE 'America/Sao_Paulo'`, filtros.de);
    if (filtros.ate) adicionar(`s.criado_em < ((?::date + 1)::timestamp AT TIME ZONE 'America/Sao_Paulo')`, filtros.ate);

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';

    // A página e o total usam o MESMO filtro. A ordem (data e depois código) é estável, então
    // nenhum item se repete nem se perde ao mudar de página.
    const { pagina, porPagina } = filtros;
    const [itens, contagem] = await Promise.all([
      query<SolicitacaoRow>(
        `${SELECT_BASE} ${where} ORDER BY s.criado_em DESC, s.id DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, porPagina, (pagina - 1) * porPagina],
      ),
      query<{ total: number }>(`SELECT COUNT(*)::int AS total FROM solicitacoes s ${where}`, params),
    ]);
    return { itens: itens.rows.map(paraSolicitacao), total: contagem.rows[0].total };
  },

  // A condição `status = 'aberto'` no próprio UPDATE evita condição de corrida: se alguém mudou o status
  // entre a verificação e a gravação, nenhuma linha é alterada. Retorna true se alterou.
  async atualizar(id: number, dados: SolicitacaoInput): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE solicitacoes
          SET titulo = $1, descricao = $2, categoria = $3, atualizado_em = NOW()
        WHERE id = $4 AND status = 'aberto' AND excluido_em IS NULL`,
      [dados.titulo, dados.descricao, dados.categoria, id],
    );
    return (rowCount ?? 0) > 0;
  },

  // Mesma proteção do atualizar: só exclui se ainda estiver aberta.
  async excluir(id: number): Promise<boolean> {
    // Exclusão LÓGICA: a linha permanece no banco (trilha de auditoria) e apenas deixa de aparecer. O código (id)
    // nunca é reaproveitado. `excluido_em IS NULL` também impede "excluir de novo" (a segunda vez responde 404).
    const { rowCount } = await query(
      `UPDATE solicitacoes SET excluido_em = NOW(), atualizado_em = NOW()
        WHERE id = $1 AND status = 'aberto' AND excluido_em IS NULL`,
      [id],
    );
    return (rowCount ?? 0) > 0;
  },

  // Só altera se o status ainda for o `atual` lido pelo service (evita dois atendentes sobrescreverem um ao outro).
  // O evento do histórico é gravado na mesma transação, e SÓ se a mudança de fato ocorreu: duas mudanças simultâneas
  // para o mesmo status geram um único evento. Retorna true se alterou.
  async atualizarStatus(id: number, atual: Status, novo: Status, usuarioId: number): Promise<boolean> {
    return transacao(async (cliente) => {
      const { rowCount } = await cliente.query(
        'UPDATE solicitacoes SET status = $1, atualizado_em = NOW() WHERE id = $2 AND status = $3 AND excluido_em IS NULL',
        [novo, id, atual],
      );
      if ((rowCount ?? 0) === 0) return false;
      await cliente.query(
        'INSERT INTO historico_status (solicitacao_id, status_anterior, status_novo, usuario_id) VALUES ($1, $2, $3, $4)',
        [id, atual, novo, usuarioId],
      );
      return true;
    });
  },
};
