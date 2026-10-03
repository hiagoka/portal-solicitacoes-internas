import { z } from 'zod';
import { CATEGORIAS, STATUS } from '../types/solicitacao';

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

// ---- Filtros da listagem (query string) ----
// O formulário pode enviar campos vazios (?status=&busca=); tratamos "" como "não informado".
const vazioParaUndefined = (v: unknown) => (v === '' ? undefined : v);

const dataIso = z.preprocess(
  vazioParaUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD')
    .refine((v) => new Date(`${v}T00:00:00Z`).toISOString().slice(0, 10) === v, 'Data inválida')
    .optional(),
);

export const filtrosSchema = z
  .object({
    status: z.preprocess(vazioParaUndefined, z.enum(STATUS, { error: `Status inválido. Use: ${STATUS.join(', ')}` }).optional()),
    categoria: z.preprocess(vazioParaUndefined, z.enum(CATEGORIAS, { error: `Categoria inválida. Use: ${CATEGORIAS.join(', ')}` }).optional()),
    busca: z.preprocess(vazioParaUndefined, z.string().trim().max(100, 'A busca pode ter no máximo 100 caracteres').optional()),
    de: dataIso,
    ate: dataIso,
  })
  .refine((f) => !f.de || !f.ate || f.de <= f.ate, { message: 'A data inicial não pode ser maior que a final', path: ['de'] });

export type FiltrosSolicitacao = z.infer<typeof filtrosSchema>;

export const alterarStatusSchema = z.object({
  status: z.enum(STATUS, { error: `Status inválido. Use: ${STATUS.join(', ')}` }),
});

export type AlterarStatusInput = z.infer<typeof alterarStatusSchema>;
