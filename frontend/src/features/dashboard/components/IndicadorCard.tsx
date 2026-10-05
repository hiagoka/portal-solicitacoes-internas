import { Link } from 'react-router'
import { Card } from '@/components/ui'
import { ROTAS, STATUS_CLASSES, STATUS_LABEL } from '@/constants'
import type { Status } from '@/types'

type IndicadorCardProps = {
  /** `total` usa a cor de destaque; os demais usam a cor do status correspondente. */
  tipo: 'total' | Status
  valor: number
}

export function IndicadorCard({ tipo, valor }: IndicadorCardProps) {
  const rotulo = tipo === 'total' ? 'Total de solicitações' : STATUS_LABEL[tipo]
  const corDoPonto = tipo === 'total' ? 'bg-primary' : STATUS_CLASSES[tipo].barra

  // O cartão inteiro é um link para a lista (já filtrada pelo status, exceto no total).
  const destino = tipo === 'total' ? ROTAS.solicitacoes : ROTAS.solicitacoesPorStatus(tipo)

  return (
    <Link
      to={destino}
      aria-label={`${rotulo}: ${valor}. Abrir a lista`}
      className="block rounded-lg"
    >
      <Card className="h-full transition-colors hover:border-primary">
        <div className="flex items-center gap-2 text-sm text-textMuted">
          <span aria-hidden="true" className={`size-2.5 rounded-full ${corDoPonto}`} />
          {rotulo}
        </div>
        <p className="mt-2 text-4xl font-semibold tabular-nums text-text">{valor.toLocaleString('pt-BR')}</p>
      </Card>
    </Link>
  )
}
