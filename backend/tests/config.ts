// Banco exclusivo dos testes: nunca o de desenvolvimento, porque os testes apagam e recriam as tabelas.
export const TEST_DATABASE_URL =
  process.env.TEST_DATABASE_URL ?? 'postgres://postgres:postgres@localhost:5432/portal_test';
