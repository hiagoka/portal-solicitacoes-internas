import { Pool } from 'pg';
import { env } from './env';

// Pool: conjunto de conexões reutilizáveis com o Postgres.
// Abrir uma conexão a cada requisição seria lento; o pool reaproveita as abertas.
export const pool = new Pool({ connectionString: env.DATABASE_URL });

// Quando o banco reinicia ou a rede derruba uma conexão que estava ociosa no pool, o pg emite "error" no pool.
// Sem um ouvinte, o Node trata isso como exceção não capturada e o processo inteiro morre. Com o ouvinte, a
// conexão ruim é descartada e a próxima consulta abre outra automaticamente.
pool.on('error', (erro) => {
  if (env.NODE_ENV !== 'test') console.error('Conexão ociosa do banco encerrada:', erro.message);
});

// Executa uma query parametrizada. Os valores vão em `params` ($1, $2...) e nunca
// são concatenados no texto SQL: é isso que impede SQL injection.
export function query<T extends object = Record<string, unknown>>(texto: string, params: unknown[] = []) {
  return pool.query<T>(texto, params);
}
