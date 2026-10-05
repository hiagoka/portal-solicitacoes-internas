import { Button, Card, Spinner } from '@/components/ui'
import { STATUS_CLASSES, STATUS_LABEL } from '@/constants'
import { formatarDataHora } from '@/lib/formatar'
import type { EventoHistorico } from '@/types'
import { useHistorico } from '../hooks'

type HistoricoCardProps = {
  solicitacaoId: number
  /** Data da última atualização: quando muda, o histórico é recarregado. */
  atualizadoEm: string
}

function descricaoDoEvento(evento: EventoHistorico) {
  if (!evento.statusAnterior) return <>Solicitação <strong>aberta</strong></>
  return (
    <>
      Status alterado de <strong>{STATUS_LABEL[evento.statusAnterior]}</strong> para <strong>{STATUS_LABEL[evento.statusNovo]}</strong>
    </>
  )
}

// Linha do tempo: quem abriu a solicitação e quem mudou cada status, com data e hora.
export function HistoricoCard({ solicitacaoId, atualizadoEm }: HistoricoCardProps) {
  const { eventos, carregando, erro, recarregar } = useHistorico(solicitacaoId, atualizadoEm)

  return (
    <Card padding="lg">
      <h2 className="text-base font-semibold text-text">Histórico de status</h2>

      {erro ? (
        <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-textMuted">
          {erro}
          <Button variant="secondary" size="sm" onClick={recarregar}>Tentar novamente</Button>
        </div>
      ) : eventos === null ? (
        <div className="mt-4 flex justify-center text-primary"><Spinner label="Carregando histórico" /></div>
      ) : (
        <ol aria-label="Histórico de status" aria-busy={carregando} className="mt-4 ml-1.5 space-y-5 border-l border-border">
          {eventos.map((evento) => (
            <li key={evento.id} className="relative pl-5">
              <span aria-hidden="true" className={`absolute -left-1.5 top-1 size-3 rounded-full ring-4 ring-surface ${STATUS_CLASSES[evento.statusNovo].barra}`} />
              <p className="text-sm text-text">{descricaoDoEvento(evento)}</p>
              <p className="mt-0.5 text-xs text-textMuted">
                por {evento.usuario.nome} · <time dateTime={evento.criadoEm}>{formatarDataHora(evento.criadoEm)}</time>
              </p>
            </li>
          ))}
        </ol>
      )}
    </Card>
  )
}
