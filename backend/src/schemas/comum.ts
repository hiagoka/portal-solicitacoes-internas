import { z } from 'zod';

// O PostgreSQL não aceita o caractere nulo (\u0000) em colunas de texto: a consulta falharia com um erro de
// codificação e a API responderia 500 por causa de um erro do cliente. Rejeitar na validação devolve um 400 claro.
export const MENSAGEM_TEXTO_INVALIDO = 'O texto contém caracteres inválidos';

export const semNulo = (texto: z.ZodString) => texto.refine((v) => !v.includes('\u0000'), MENSAGEM_TEXTO_INVALIDO);

// Maior valor de uma coluna INTEGER do PostgreSQL (SERIAL). Um código maior nunca existe, e enviá-lo ao banco
// geraria "value out of range" (500), então é recusado já na validação.
export const MAIOR_INTEIRO_DO_BANCO = 2_147_483_647;
