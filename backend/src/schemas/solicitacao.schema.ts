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
export const POR_PAGINA_PADRAO = 10;
export const LIMITE_POR_PAGINA = 50;

// O formulário pode enviar campos vazios (?status=&busca=); tratamos "" como "não informado".
const vazioParaUndefined = (v: unknown) => (v === '' ? undefined : v);

const dataIso = z.preprocess(
  vazioParaUndefined,
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Use o formato AAAA-MM-DD')
    // O refine roda mesmo se o regex acima falhar, então precisa tolerar entradas que não são datas:
    // toISOString() lançaria RangeError (500) numa data inválida.
    .refine((v) => {
      const data = new Date(`${v}T00:00:00Z`);
      return !Number.isNaN(data.getTime()) && data.toISOString().slice(0, 10) === v;
    }, 'Data inválida')
    .optional(),
);

export const filtrosSchema = z
  .object({
    status: z.preprocess(vazioParaUndefined, z.enum(STATUS, { error: `Status inválido. Use: ${STATUS.join(', ')}` }).optional()),
    categoria: z.preprocess(vazioParaUndefined, z.enum(CATEGORIAS, { error: `Categoria inválida. Use: ${CATEGORIAS.join(', ')}` }).optional()),
    busca: z.preprocess(vazioParaUndefined, z.string().trim().max(100, 'A busca pode ter no máximo 100 caracteres').optional()),
    de: dataIso,
    ate: dataIso,
    pagina: z.preprocess(
      vazioParaUndefined,
      z.coerce.number({ error: 'A página precisa ser um número' }).int('A página precisa ser um número inteiro').min(1, 'A página precisa ser 1 ou maior').default(1),
    ),
    porPagina: z.preprocess(
      vazioParaUndefined,
      z.coerce
        .number({ error: 'O tamanho da página precisa ser um número' })
        .int('O tamanho da página precisa ser um número inteiro')
        .min(1, 'O tamanho da página precisa ser 1 ou maior')
        .max(LIMITE_POR_PAGINA, `O tamanho da página pode ser no máximo ${LIMITE_POR_PAGINA}`)
        .default(POR_PAGINA_PADRAO),
    ),
  })
  .refine((f) => !f.de || !f.ate || f.de <= f.ate, { message: 'A data inicial não pode ser maior que a final', path: ['de'] });

export type FiltrosSolicitacao = z.infer<typeof filtrosSchema>;

export const alterarStatusSchema = z.object({
  status: z.enum(STATUS, { error: `Status inválido. Use: ${STATUS.join(', ')}` }),
});

export type AlterarStatusInput = z.infer<typeof alterarStatusSchema>;
