import { useState } from 'react'
import { Button, Card, Select } from '@/components/ui'
import { STATUS_LABEL, STATUS_TRANSICOES } from '@/constants'
import type { Status } from '@/types'

type StatusSelectProps = {
  statusAtual: Status
  alterando: boolean
  onAlterar: (novo: Status) => void
}

// Atendimento: oferece só as mudanças de status que a API aceita a partir do status atual.
export function StatusSelect({ statusAtual, alterando, onAlterar }: StatusSelectProps) {
  const [novo, setNovo] = useState<Status | ''>('')
  const opcoes = STATUS_TRANSICOES[statusAtual].map((s) => ({ value: s, label: STATUS_LABEL[s] }))

  function confirmar() {
    if (!novo) return
    onAlterar(novo)
    setNovo('')
  }

  return (
    <Card>
      <h2 className="mb-3 text-base font-semibold text-text">Atendimento</h2>
      <div className="flex flex-wrap items-end gap-3">
        <div className="min-w-48 flex-1">
          <Select
            label="Alterar status para"
            placeholder="Selecione..."
            options={opcoes}
            value={novo}
            onChange={(e) => setNovo(e.target.value as Status | '')}
            disabled={alterando}
          />
        </div>
        <Button onClick={confirmar} disabled={!novo} loading={alterando}>
          Atualizar status
        </Button>
      </div>
    </Card>
  )
}
