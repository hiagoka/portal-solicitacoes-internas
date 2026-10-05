import { query } from '../config/database';
import type { Status } from '../types/solicitacao';

export const dashboardRepository = {
  // Uma única consulta agrupada devolve a contagem de cada status.
  // Status sem nenhuma solicitação não aparecem no resultado; o service completa com zero.
  async contarPorStatus(usuarioId?: number): Promise<Partial<Record<Status, number>>> {
    // As excluídas (exclusão lógica) não entram na contagem.
    const where = usuarioId === undefined ? 'WHERE excluido_em IS NULL' : 'WHERE excluido_em IS NULL AND usuario_id = $1';
    const params = usuarioId === undefined ? [] : [usuarioId];
    const { rows } = await query<{ status: Status; total: number }>(
      `SELECT status, COUNT(*)::int AS total FROM solicitacoes ${where} GROUP BY status`,
      params,
    );
    return Object.fromEntries(rows.map((r) => [r.status, r.total]));
  },
};
