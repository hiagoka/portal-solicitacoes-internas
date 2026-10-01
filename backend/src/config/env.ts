import 'dotenv/config';
import { z } from 'zod';

// Valida as variáveis de ambiente na inicialização: se faltar algo, a aplicação
// falha logo com uma mensagem clara, em vez de quebrar no meio de uma requisição.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

const resultado = schema.safeParse(process.env);

if (!resultado.success) {
  const problemas = resultado.error.issues
    .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
    .join('\n');
  throw new Error(`Variáveis de ambiente inválidas:\n${problemas}`);
}

export const env = resultado.data;
