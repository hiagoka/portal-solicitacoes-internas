import { Link } from 'react-router'
import { CATEGORIA_LABEL, ROTAS } from '@/constants'
import { formatarCodigo, formatarData } from '@/lib/formatar'
import type { Solicitacao } from '@/types'
import { StatusBadge } from './StatusBadge'

// Uma solicitação em formato de cartão, para telas pequenas (onde uma tabela de 6 colunas não cabe).
export function SolicitacaoCard({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <li className="flex flex-col gap-2 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono text-sm text-textMuted">{formatarCodigo(s.id)}</span>
        <StatusBadge status={s.status} />
      </div>
      <Link to={ROTAS.detalhesSolicitacao(s.id)} className="break-words font-medium text-text hover:text-primary hover:underline">
        {s.titulo}
      </Link>
      <p className="text-sm text-textMuted">
        {CATEGORIA_LABEL[s.categoria]} · {s.solicitante.nome} · {formatarData(s.criadoEm)}
      </p>
    </li>
  )
}
