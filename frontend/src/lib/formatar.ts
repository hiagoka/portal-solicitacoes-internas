// Mesmo fuso usado pelo filtro de período da API (decisão 022): o dia mostrado aqui é o dia filtrado lá.
const FUSO = 'America/Sao_Paulo'

const formatoData = new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO })
const formatoDataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: FUSO,
})

/** "2026-10-03T16:02:23.217Z" → "03/10/2026" */
export function formatarData(iso: string): string {
  return formatoData.format(new Date(iso))
}

/** "2026-10-03T16:02:23.217Z" → "03/10/2026 13:02" */
export function formatarDataHora(iso: string): string {
  return formatoDataHora.format(new Date(iso)).replace(', ', ' ')
}

/** 7 → "#0007". O código da solicitação é o id do banco. */
export function formatarCodigo(id: number): string {
  return `#${String(id).padStart(4, '0')}`
}

/** Faixa de itens exibida numa página: (2, 10, 23) → "11–20 de 23". Sem itens: "0 de 0". */
export function formatarIntervalo(pagina: number, porPagina: number, total: number): string {
  if (total === 0) return '0 de 0'
  const inicio = (pagina - 1) * porPagina + 1
  const fim = Math.min(pagina * porPagina, total)
  return `${inicio}–${fim} de ${total}`
}
