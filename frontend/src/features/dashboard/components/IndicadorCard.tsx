import { Card } from '@/components/ui'
import { STATUS_CLASSES, STATUS_LABEL } from '@/constants'
import type { Status } from '@/types'

type IndicadorCardProps = {
  /** `total` usa a cor de destaque; os demais usam a cor do status correspondente. */
  tipo: 'total' | Status
  valor: number
}

export function IndicadorCard({ tipo, valor }: IndicadorCardProps) {
  const rotulo = tipo === 'total' ? 'Total de solicitações' : STATUS_LABEL[tipo]
  const corDoPonto = tipo === 'total' ? 'bg-primary' : STATUS_CLASSES[tipo].barra

  return (
    <Card>
      <div className="flex items-center gap-2 text-sm text-textMuted">
        <span aria-hidden="true" className={`size-2.5 rounded-full ${corDoPonto}`} />
        {rotulo}
      </div>
      <p className="mt-2 text-4xl font-semibold tabular-nums text-text">{valor.toLocaleString('pt-BR')}</p>
    </Card>
  )
}
