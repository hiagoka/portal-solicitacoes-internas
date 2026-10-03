import { query } from '../config/database';
import type { Solicitacao } from '../types/solicitacao';
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

  // Monta o WHERE dinamicamente, mas só com condições fixas no código; os VALORES sempre vão
  // em parâmetros ($1, $2...). Assim a combinação de filtros é segura contra SQL injection.
  async listar(filtros: FiltrosListagem = {}): Promise<Solicitacao[]> {
    const condicoes: string[] = [];
    const params: unknown[] = [];
    const adicionar = (condicao: string, valor: unknown) => {
      params.push(valor);
      condicoes.push(condicao.replace('?', `$${params.length}`));
    };

    if (filtros.usuarioId !== undefined) adicionar('s.usuario_id = ?', filtros.usuarioId);
    if (filtros.status) adicionar('s.status = ?', filtros.status);
    if (filtros.categoria) adicionar('s.categoria = ?', filtros.categoria);
    // [filtros adicionais]

    const where = condicoes.length ? `WHERE ${condicoes.join(' AND ')}` : '';
    const { rows } = await query<SolicitacaoRow>(`${SELECT_BASE} ${where} ORDER BY s.criado_em DESC, s.id DESC`, params);
    return rows.map(paraSolicitacao);
  },

  // A condição `status = 'aberto'` no próprio UPDATE evita condição de corrida: se alguém mudou o status
  // entre a verificação e a gravação, nenhuma linha é alterada. Retorna true se alterou.
  async atualizar(id: number, dados: SolicitacaoInput): Promise<boolean> {
    const { rowCount } = await query(
      `UPDATE solicitacoes
          SET titulo = $1, descricao = $2, categoria = $3, atualizado_em = NOW()
        WHERE id = $4 AND status = 'aberto'`,
      [dados.titulo, dados.descricao, dados.categoria, id],
    );
    return (rowCount ?? 0) > 0;
  },

  // Mesma proteção do atualizar: só exclui se ainda estiver aberta.
  async excluir(id: number): Promise<boolean> {
    const { rowCount } = await query(`DELETE FROM solicitacoes WHERE id = $1 AND status = 'aberto'`, [id]);
    return (rowCount ?? 0) > 0;
  },
};
