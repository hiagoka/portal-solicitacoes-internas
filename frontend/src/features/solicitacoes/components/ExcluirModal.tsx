import { Button, Modal } from '@/components/ui'
import { formatarCodigo } from '@/lib/formatar'

type ExcluirModalProps = {
  open: boolean
  codigo: number
  titulo: string
  excluindo: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ExcluirModal({ open, codigo, titulo, excluindo, onConfirmar, onCancelar }: ExcluirModalProps) {
  return (
    <Modal
      open={open}
      onClose={onCancelar}
      title="Excluir solicitação?"
      size="sm"
      bloqueado={excluindo}
      footer={
        <>
          <Button variant="secondary" onClick={onCancelar} disabled={excluindo}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={onConfirmar} loading={excluindo}>
            Excluir
          </Button>
        </>
      }
    >
      <p>
        A solicitação <strong>{formatarCodigo(codigo)}</strong> ({titulo}) será excluída definitivamente. Esta ação não pode
        ser desfeita.
      </p>
    </Modal>
  )
}
