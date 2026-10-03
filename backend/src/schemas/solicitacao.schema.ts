import { z } from 'zod';
import { CATEGORIAS } from '../types/solicitacao';

// Usado na criação e na edição. Status, data e solicitante NÃO fazem parte: são definidos pelo servidor.
export const solicitacaoSchema = z.object({
  titulo: z.string().trim().min(3, 'O título precisa ter ao menos 3 caracteres').max(150, 'O título pode ter no máximo 150 caracteres'),
  descricao: z.string().trim().min(1, 'Informe a descrição').max(5000, 'A descrição pode ter no máximo 5000 caracteres'),
  categoria: z.enum(CATEGORIAS, { error: `Categoria inválida. Use: ${CATEGORIAS.join(', ')}` }),
});

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export type SolicitacaoInput = z.infer<typeof solicitacaoSchema>;
