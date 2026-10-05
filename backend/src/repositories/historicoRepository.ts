import { query } from '../config/database';
import type { EventoHistorico, Status } from '../types/solicitacao';

interface EventoRow {
  id: number;
  status_anterior: Status | null;
  status_novo: Status;
  criado_em: Date;
  usuario_id: number;
  usuario_nome: string;
}

export const historicoRepository = {
  // Eventos de uma solicitação, do mais antigo ao mais recente (o id desempata eventos no mesmo instante).
  async listar(solicitacaoId: number): Promise<EventoHistorico[]> {
    const { rows } = await query<EventoRow>(
      `SELECT h.id, h.status_anterior, h.status_novo, h.criado_em, h.usuario_id, u.nome AS usuario_nome
         FROM historico_status h
         JOIN usuarios u ON u.id = h.usuario_id
        WHERE h.solicitacao_id = $1
        ORDER BY h.criado_em ASC, h.id ASC`,
      [solicitacaoId],
    );
    return rows.map((r) => ({
      id: r.id,
      statusAnterior: r.status_anterior,
      statusNovo: r.status_novo,
      criadoEm: r.criado_em,
      usuario: { id: r.usuario_id, nome: r.usuario_nome },
    }));
  },
};
