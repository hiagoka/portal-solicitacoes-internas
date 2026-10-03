import { afterAll } from 'vitest';
import { pool } from '../src/config/database';

// Fecha as conexões ao final de cada arquivo de teste para o processo encerrar limpo.
afterAll(async () => {
  await pool.end();
});
