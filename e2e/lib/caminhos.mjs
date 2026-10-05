import { fileURLToPath } from 'node:url'

// Pasta onde os testes gravam capturas de tela, ao lado de `lib/` (e2e/resultados). `fileURLToPath` converte a URL do módulo
// em um caminho de arquivo de verdade (decodifica "%20" e acentos); usar `.pathname` deixaria a codificação de URL no nome.
export function pastaDeSaida(urlDoHarness) {
  return fileURLToPath(new URL('../resultados/', urlDoHarness)).replace(/[\\/]$/, '')
}
