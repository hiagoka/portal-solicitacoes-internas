import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import request from 'supertest';
import { app } from '../src/app';
import { pool } from '../src/config/database';

const SQL_DIR = join(__dirname, '..', '..', 'database');
const schema = readFileSync(join(SQL_DIR, 'schema.sql'), 'utf8');
const seed = readFileSync(join(SQL_DIR, 'seed.sql'), 'utf8');

// Recria as tabelas com os dados de demonstração. Usado antes de cada teste para que um
// teste nunca dependa do que outro alterou.
export async function resetarBanco() {
  await pool.query(schema);
  await pool.query(seed);
}

// Usuários do seed.sql. Todos usam a senha "senha123".
export type UsuarioSeed = 'maria' | 'joao' | 'atendente';

// Retorna um "agente" do Supertest já autenticado: ele guarda o cookie de sessão entre as chamadas.
export async function loginComo(usuario: UsuarioSeed) {
  const agente = request.agent(app);
  const resposta = await agente.post('/auth/login').send({ usuario, senha: 'senha123' });
  if (resposta.status !== 200) throw new Error(`Login de teste falhou para ${usuario}: ${resposta.status}`);
  return agente;
}

export { app, request };
