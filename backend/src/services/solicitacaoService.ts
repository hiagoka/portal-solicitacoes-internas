import { AppError } from '../middlewares/AppError';
import { historicoRepository } from '../repositories/historicoRepository';
import { solicitacaoRepository } from '../repositories/solicitacaoRepository';
import type { FiltrosSolicitacao, SolicitacaoInput } from '../schemas/solicitacao.schema';
import { TRANSICOES, type EventoHistorico, type Paginacao, type Solicitacao, type Status } from '../types/solicitacao';
import type { UsuarioPublico } from '../types/usuario';

export const solicitacaoService = {
  // O solicitante vem do usuário logado e o status inicial do banco: o cliente não consegue forjá-los.
  async criar(usuario: UsuarioPublico, dados: SolicitacaoInput): Promise<Solicitacao> {
    const id = await solicitacaoRepository.inserir(dados, usuario.id);
    return this.obter(usuario, id);
  },

  // Atendente enxerga qualquer solicitação. Solicitante só as próprias; nas demais responde 404
  // (e não 403) para não revelar que o código existe.
  async obter(usuario: UsuarioPublico, id: number): Promise<Solicitacao> {
    const solicitacao = await solicitacaoRepository.buscarPorId(id);
    const visivel = solicitacao && (usuario.perfil === 'atendente' || solicitacao.solicitante.id === usuario.id);
    if (!solicitacao || !visivel) throw AppError.notFound('Solicitação não encontrada');
    return solicitacao;
  },

  // Atendente lista todas; solicitante apenas as próprias. Devolve uma página e os dados para navegar entre elas.
  async listar(usuario: UsuarioPublico, filtros: FiltrosSolicitacao): Promise<{ solicitacoes: Solicitacao[]; paginacao: Paginacao }> {
    const usuarioId = usuario.perfil === 'atendente' ? undefined : usuario.id;
    const { itens, total } = await solicitacaoRepository.listar({ ...filtros, usuarioId });
    return {
      solicitacoes: itens,
      paginacao: {
        pagina: filtros.pagina,
        porPagina: filtros.porPagina,
        total,
        totalPaginas: Math.max(1, Math.ceil(total / filtros.porPagina)),
      },
    };
  },

  // Regras de edição e exclusão: só o autor, e só enquanto a solicitação estiver aberta.
  // 404 = não existe/não visível, 403 = não é o autor, 409 = já saiu do status aberto.
  async garantirEditavel(usuario: UsuarioPublico, id: number): Promise<void> {
    const solicitacao = await this.obter(usuario, id);
    if (solicitacao.solicitante.id !== usuario.id) throw AppError.forbidden('Apenas o autor pode alterar esta solicitação');
    if (solicitacao.status !== 'aberto') throw AppError.conflict('Apenas solicitações abertas podem ser alteradas ou excluídas');
  },

  async editar(usuario: UsuarioPublico, id: number, dados: SolicitacaoInput): Promise<Solicitacao> {
    await this.garantirEditavel(usuario, id);
    const alterou = await solicitacaoRepository.atualizar(id, dados);
    if (!alterou) throw AppError.conflict('A solicitação deixou de estar aberta');
    return this.obter(usuario, id);
  },

  async excluir(usuario: UsuarioPublico, id: number): Promise<void> {
    await this.garantirEditavel(usuario, id);
    const excluiu = await solicitacaoRepository.excluir(id);
    if (!excluiu) throw AppError.conflict('A solicitação deixou de estar aberta');
  },

  // A autorização (só atendente) é feita na rota; aqui ficam as regras de transição.
  async alterarStatus(usuario: UsuarioPublico, id: number, novo: Status): Promise<Solicitacao> {
    const solicitacao = await this.obter(usuario, id);
    if (solicitacao.status === novo) throw AppError.conflict('A solicitação já está com este status');
    if (!TRANSICOES[solicitacao.status].includes(novo)) {
      throw AppError.conflict(`Não é possível mudar de "${solicitacao.status}" para "${novo}"`);
    }
    const alterou = await solicitacaoRepository.atualizarStatus(id, solicitacao.status, novo, usuario.id);
    if (!alterou) throw AppError.conflict('O status foi alterado por outra pessoa. Atualize a página e tente novamente');
    return this.obter(usuario, id);
  },

  // O histórico segue a mesma visibilidade da solicitação: `obter` já devolve 404 para quem não pode vê-la
  // (ou se foi excluída), e só então os eventos são lidos.
  async historico(usuario: UsuarioPublico, id: number): Promise<EventoHistorico[]> {
    await this.obter(usuario, id);
    return historicoRepository.listar(id);
  },
};
