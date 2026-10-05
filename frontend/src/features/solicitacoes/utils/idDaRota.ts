// Maior valor de uma coluna INTEGER do PostgreSQL: um código maior nunca existe (e a API o recusaria com 400).
const MAIOR_CODIGO = 2_147_483_647

// Lê o código da URL (/solicitacoes/:id) com o mesmo critério da API: só a forma canônica (dígitos, sem zeros à esquerda,
// sinal, expoente nem hexadecimal) e dentro do INTEGER do banco. Qualquer outra coisa devolve NaN, que as telas tratam como
// "solicitação não encontrada" SEM consultar a API (a consulta nunca poderia dar certo).
export function lerIdDaRota(texto: string | undefined): number {
  if (!texto || !/^[1-9]\d{0,9}$/.test(texto)) return NaN
  const id = Number(texto)
  return id <= MAIOR_CODIGO ? id : NaN
}
