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
    fileParallelism: false, // todos os arquivos compartilham o mesmo banco de testes
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: TEST_DATABASE_URL,
      JWT_SECRET: 'segredo-somente-para-testes-1234567890',
    },
  },
});
