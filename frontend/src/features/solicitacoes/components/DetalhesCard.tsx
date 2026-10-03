import type { ReactNode } from 'react'
import { Card } from '@/components/ui'
import { CATEGORIA_LABEL } from '@/constants'
import { formatarCodigo, formatarDataHora } from '@/lib/formatar'
import type { Solicitacao } from '@/types'
import { StatusBadge } from './StatusBadge'

function Dado({ rotulo, children }: { rotulo: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-textMuted">{rotulo}</dt>
      <dd className="mt-1 text-sm text-text">{children}</dd>
    </div>
  )
}

export function DetalhesCard({ solicitacao: s }: { solicitacao: Solicitacao }) {
  return (
    <Card padding="lg">
      <dl className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <Dado rotulo="Código"><span className="font-mono">{formatarCodigo(s.id)}</span></Dado>
        <Dado rotulo="Status"><StatusBadge status={s.status} /></Dado>
        <Dado rotulo="Categoria">{CATEGORIA_LABEL[s.categoria]}</Dado>
        <Dado rotulo="Solicitante">{s.solicitante.nome}</Dado>
        <Dado rotulo="Aberta em">{formatarDataHora(s.criadoEm)}</Dado>
        <Dado rotulo="Última atualização">{formatarDataHora(s.atualizadoEm)}</Dado>
      </dl>
      <div className="mt-6 border-t border-border pt-5">
        <h2 className="text-xs font-medium uppercase tracking-wide text-textMuted">Descrição</h2>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-text">{s.descricao}</p>
      </div>
    </Card>
  )
}
