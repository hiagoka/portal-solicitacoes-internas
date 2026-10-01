import { Pool } from 'pg';
import { env } from './env';

// Pool: conjunto de conexões reutilizáveis com o Postgres.
// Abrir uma conexão a cada requisição seria lento; o pool reaproveita as abertas.
export const pool = new Pool({ connectionString: env.DATABASE_URL });

// Executa uma query parametrizada. Os valores vão em `params` ($1, $2...) e nunca
// são concatenados no texto SQL: é isso que impede SQL injection.
export function query<T extends object = Record<string, unknown>>(texto: string, params: unknown[] = []) {
  return pool.query<T>(texto, params);
}
