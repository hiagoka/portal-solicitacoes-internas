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
};
