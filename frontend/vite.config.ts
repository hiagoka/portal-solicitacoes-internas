import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // "@/components/ui" → "src/components/ui"
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
    // Cobertura medida só na LÓGICA que os testes unitários miram. A interface (componentes e páginas) é coberta pelos testes
    // de navegador, que o v8 não contabiliza; misturá-la aqui daria um número enganosamente baixo.
    coverage: {
      provider: 'v8',
      include: ['src/lib/**', 'src/services/**', 'src/constants/**', 'src/styles/theme.ts', 'src/features/*/utils/**'],
      exclude: ['**/*.test.ts', '**/index.ts'],
      reporter: ['text-summary', 'text'],
      // Pisos um pouco abaixo do medido (instruções 79%, ramos 95%). As funções ficam sem piso: os métodos dos services são
      // cobertos pelos testes de navegador, que o v8 não conta.
      thresholds: { statements: 75, branches: 90 },
    },
  },
})
