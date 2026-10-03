import { Card } from '@/components/ui'
import { STATUS_CLASSES, STATUS_LABEL, STATUS_LISTA } from '@/constants'
import type { Indicadores, Status } from '@/types'

const VALOR_POR_STATUS: Record<Status, (i: Indicadores) => number> = {
  aberto: (i) => i.abertas,
  em_atendimento: (i) => i.emAtendimento,
  concluido: (i) => i.concluidas,
}

// Barra empilhada com a proporção de cada status. A informação não depende só da cor:
// a legenda traz o nome, a quantidade e a porcentagem, e a barra tem descrição para leitores de tela.
export function DistribuicaoBar({ indicadores }: { indicadores: Indicadores }) {
  const itens = STATUS_LISTA.map((status) => {
    const valor = VALOR_POR_STATUS[status](indicadores)
    const porcentagem = indicadores.total ? (valor / indicadores.total) * 100 : 0
    return { status, valor, porcentagem }
  })
  const resumo = itens.map((i) => `${STATUS_LABEL[i.status]}: ${i.valor} (${Math.round(i.porcentagem)}%)`).join(', ')

  return (
    <Card>
      <h2 className="text-base font-semibold text-text">Distribuição por status</h2>

      {indicadores.total === 0 ? (
        <p className="mt-3 text-sm text-textMuted">Ainda não há solicitações para exibir.</p>
      ) : (
        <>
          <div role="img" aria-label={resumo} className="mt-4 flex h-3 overflow-hidden rounded-full bg-border">
            {itens.map(({ status, porcentagem }) => (
              <div key={status} className={STATUS_CLASSES[status].barra} style={{ width: `${porcentagem}%` }} />
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm">
            {itens.map(({ status, valor, porcentagem }) => (
              <li key={status} className="flex items-center gap-2 text-textMuted">
                <span aria-hidden="true" className={`size-2.5 rounded-full ${STATUS_CLASSES[status].barra}`} />
                {STATUS_LABEL[status]}: <strong className="font-medium text-text">{valor}</strong> ({Math.round(porcentagem)}%)
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  )
}
