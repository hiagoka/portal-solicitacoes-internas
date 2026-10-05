import { defineConfig } from 'vitest/config';
import { TEST_DATABASE_URL } from './tests/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    globalSetup: ['tests/globalSetup.ts'],
    setupFiles: ['tests/setup.ts'],
    // Testes de integração fazem login (bcrypt) e várias consultas; em máquina ou CI sobrecarregados o limite padrão de 5 s é curto.
    testTimeout: 15_000,
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts'], // só abre a porta e trata sinais de encerramento: coberto pelo teste de infraestrutura, não pelo Vitest
      reporter: ['text-summary', 'text'],
      // Pisos um pouco ABAIXO do medido (instruções 96%, ramos 86%, funções 99%, linhas 99%): a cobertura não pode regredir sem alguém notar.
      thresholds: { statements: 94, branches: 82, functions: 95, lines: 97 },
    },
    fileParallelism: false, // todos os arquivos compartilham o mesmo banco de testes
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'segredo-somente-para-testes-1234567890',
    },
  },
});
