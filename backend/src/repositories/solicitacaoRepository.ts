import { query } from '../config/database';
import type { Solicitacao } from '../types/solicitacao';
import type { SolicitacaoInput } from '../schemas/solicitacao.schema';

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
  async inserir(dados: SolicitacaoInput, usuarioId: number): Promise<number> {
    const { rows } = await query<{ id: number }>(
      `INSERT INTO solicitacoes (titulo, descricao, categoria, usuario_id)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [dados.titulo, dados.descricao, dados.categoria, usuarioId],
    );
    return rows[0].id;
  },

  async buscarPorId(id: number): Promise<Solicitacao | null> {
    const { rows } = await query<SolicitacaoRow>(`${SELECT_BASE} WHERE s.id = $1`, [id]);
    return rows[0] ? paraSolicitacao(rows[0]) : null;
  },

  // `usuarioId` restringe às solicitações de um usuário (solicitante); sem ele lista todas (atendente).
  async listar(usuarioId?: number): Promise<Solicitacao[]> {
    const where = usuarioId === undefined ? '' : 'WHERE s.usuario_id = $1';
    const params = usuarioId === undefined ? [] : [usuarioId];
    const { rows } = await query<SolicitacaoRow>(`${SELECT_BASE} ${where} ORDER BY s.criado_em DESC, s.id DESC`, params);
    return rows.map(paraSolicitacao);
  },
};
