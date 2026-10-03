import { Client } from 'pg';
import { TEST_DATABASE_URL } from './config';

// Roda uma vez antes de todos os testes: cria o banco de testes se ele ainda não existir.
export default async function criarBancoDeTestes() {
  const url = new URL(TEST_DATABASE_URL);
  const nomeBanco = url.pathname.slice(1);

  url.pathname = '/postgres'; // conecta no banco administrativo para poder criar outro
  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    const { rowCount } = await admin.query('SELECT 1 FROM pg_database WHERE datname = $1', [nomeBanco]);
    if (!rowCount) await admin.query(`CREATE DATABASE "${nomeBanco.replace(/"/g, '')}"`);
  } finally {
    await admin.end();
  }
}
