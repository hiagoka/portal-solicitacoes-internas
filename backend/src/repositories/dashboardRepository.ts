import { query } from '../config/database';
import type { Status } from '../types/solicitacao';

export const dashboardRepository = {
  // Uma única consulta agrupada devolve a contagem de cada status.
  // Status sem nenhuma solicitação não aparecem no resultado; o service completa com zero.
  async contarPorStatus(usuarioId?: number): Promise<Partial<Record<Status, number>>> {
    const where = usuarioId === undefined ? '' : 'WHERE usuario_id = $1';
    const params = usuarioId === undefined ? [] : [usuarioId];
    const { rows } = await query<{ status: Status; total: number }>(
      `SELECT status, COUNT(*)::int AS total FROM solicitacoes ${where} GROUP BY status`,
      params,
    );
    return Object.fromEntries(rows.map((r) => [r.status, r.total]));
  },
};
