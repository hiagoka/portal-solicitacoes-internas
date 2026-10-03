import { AppError } from '../middlewares/AppError';
import { solicitacaoRepository } from '../repositories/solicitacaoRepository';
import type { SolicitacaoInput } from '../schemas/solicitacao.schema';
import type { Solicitacao } from '../types/solicitacao';
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

  // Atendente lista todas; solicitante apenas as próprias.
  async listar(usuario: UsuarioPublico): Promise<Solicitacao[]> {
    return solicitacaoRepository.listar(usuario.perfil === 'atendente' ? undefined : usuario.id);
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
};
