import { Badge } from '@/components/ui'
import { STATUS_CLASSES, STATUS_LABEL } from '@/constants'
import type { Status } from '@/types'

export function StatusBadge({ status }: { status: Status }) {
  const { texto, fundo } = STATUS_CLASSES[status]
  return (
    <Badge tone="custom" className={`${fundo} ${texto}`}>
      {STATUS_LABEL[status]}
    </Badge>
  )
}
