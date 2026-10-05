import 'dotenv/config';
import { z } from 'zod';

// Segredos de DEMONSTRAÇÃO publicados neste repositório (docker-compose.yml e .env.example). Como qualquer pessoa pode
// lê-los no GitHub, quem os usa em produção permite que um desconhecido assine um token válido (inclusive o do atendente).
const SEGREDOS_DE_DEMONSTRACAO = ['segredo-de-demonstracao-troque-em-producao', 'troque-por-um-segredo-longo-e-aleatorio'];

// Valida as variáveis de ambiente na inicialização: se faltar algo, a aplicação
// falha logo com uma mensagem clara, em vez de quebrar no meio de uma requisição.
const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  JWT_SECRET: z.string().min(16, 'JWT_SECRET precisa ter ao menos 16 caracteres'),
  JWT_EXPIRES_IN: z.string().default('8h'),
  COOKIE_SECURE: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  // true quando a API roda atrás de um proxy reverso (nginx), para enxergar o IP real do cliente.
  TRUST_PROXY: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  // Autorização EXPLÍCITA para rodar em produção com um segredo de demonstração (só o docker-compose de demonstração liga).
  PERMITIR_SEGREDOS_DE_DEMONSTRACAO: z.enum(['true', 'false']).default('false').transform((v) => v === 'true'),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
});

export type Env = z.infer<typeof schema>;

// Lê e valida as variáveis a partir de `fonte` (função pura, para poder ser testada sem mexer em process.env).
// Devolve também AVISOS: situações perigosas que não impedem a partida (ex.: demonstração em produção), mostradas no log.
export function lerEnv(fonte: Record<string, string | undefined>): { valores: Env; avisos: string[] } {
  const resultado = schema.safeParse(fonte);
  if (!resultado.success) {
    const problemas = resultado.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
    throw new Error(`Variáveis de ambiente inválidas:\n${problemas}`);
  }

  const valores = resultado.data;
  const avisos: string[] = [];

  if (valores.NODE_ENV === 'production') {
    if (SEGREDOS_DE_DEMONSTRACAO.includes(valores.JWT_SECRET)) {
      if (!valores.PERMITIR_SEGREDOS_DE_DEMONSTRACAO) {
        throw new Error(
          'JWT_SECRET é um valor de demonstração publicado no repositório: em produção, qualquer pessoa poderia assinar um token ' +
            'válido (inclusive o do atendente). Defina um segredo próprio e aleatório (ex.: openssl rand -hex 32). Para uma ' +
            'demonstração local, autorize explicitamente com PERMITIR_SEGREDOS_DE_DEMONSTRACAO=true.',
        );
      }
      avisos.push(
        'ATENÇÃO: o JWT_SECRET é um segredo de DEMONSTRAÇÃO público. Qualquer pessoa que leia o repositório pode forjar uma sessão. ' +
          'Use apenas para demonstrar; ao publicar de verdade, defina um segredo próprio e remova PERMITIR_SEGREDOS_DE_DEMONSTRACAO.',
      );
    }
    if (!valores.COOKIE_SECURE) {
      avisos.push('ATENÇÃO: COOKIE_SECURE=false em produção: o cookie de sessão trafega sem o atributo Secure. Sirva por HTTPS e use COOKIE_SECURE=true.');
    }
  }

  return { valores, avisos };
}

const lido = lerEnv(process.env);

export const env = lido.valores;
// Mostrados uma vez, na inicialização (server.ts).
export const avisosDeConfiguracao = lido.avisos;
