import { dashboardRepository } from '../repositories/dashboardRepository';
import type { UsuarioPublico } from '../types/usuario';

export const dashboardService = {
  // Atendente vê os números de todo o sistema; solicitante, apenas os das suas solicitações.
  async indicadores(usuario: UsuarioPublico) {
    const contagem = await dashboardRepository.contarPorStatus(usuario.perfil === 'atendente' ? undefined : usuario.id);
    const abertas = contagem.aberto ?? 0;
    const emAtendimento = contagem.em_atendimento ?? 0;
    const concluidas = contagem.concluido ?? 0;
    return { total: abertas + emAtendimento + concluidas, abertas, emAtendimento, concluidas };
  },
};
