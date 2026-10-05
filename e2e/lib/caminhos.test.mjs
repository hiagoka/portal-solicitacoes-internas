import assert from 'node:assert/strict'
import { test } from 'node:test'
import { pastaDeSaida } from './caminhos.mjs'

// `new URL(...).pathname` mantém a codificação de URL ("My%20Projects"), que NÃO é um caminho de arquivo: as capturas de tela
// seriam gravadas numa pasta literalmente chamada "My%20Projects". O correto é converter a URL em caminho do sistema de arquivos.
test('pasta de saída decodifica espaços e acentos do caminho do projeto', () => {
  const harness = new URL('file:///Users/x/My Projects/portal de solicitações/e2e/lib/harness.mjs')
  assert.equal(pastaDeSaida(harness), '/Users/x/My Projects/portal de solicitações/e2e/resultados')
})

test('caminho simples continua igual', () => {
  assert.equal(pastaDeSaida(new URL('file:///repo/e2e/lib/harness.mjs')), '/repo/e2e/resultados')
})
