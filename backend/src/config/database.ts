import { Pool, type PoolClient } from 'pg';
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

// Executa várias consultas como UMA operação: ou todas valem (COMMIT), ou nenhuma (ROLLBACK, se algo lançar erro).
// Usada quando duas gravações precisam andar juntas, como mudar o status e registrar o evento no histórico.
export async function transacao<T>(operacao: (cliente: PoolClient) => Promise<T>): Promise<T> {
  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');
    const resultado = await operacao(cliente);
    await cliente.query('COMMIT');
    return resultado;
  } catch (erro) {
    await cliente.query('ROLLBACK');
    throw erro;
  } finally {
    cliente.release();
  }
}
