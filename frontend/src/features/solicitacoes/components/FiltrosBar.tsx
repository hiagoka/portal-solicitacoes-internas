import { useId, useState } from 'react'
import { Badge, Button, Card, Input, Select } from '@/components/ui'
import { CATEGORIAS_LISTA, CATEGORIA_LABEL, STATUS_LABEL, STATUS_LISTA } from '@/constants'
import { cn } from '@/lib/cn'
import type { FiltrosSolicitacao } from '@/types'
import { LIMITE_BUSCA } from '../utils/filtrosUrl'

type FiltrosBarProps = {
  filtros: FiltrosSolicitacao
  /** Mensagem de erro do período (ex.: data inicial maior que a final). */
  erroPeriodo: string | null
  temFiltros: boolean
  onChange: (alteracao: Partial<FiltrosSolicitacao>) => void
  onLimpar: () => void
}

const OPCOES_STATUS = STATUS_LISTA.map((s) => ({ value: s, label: STATUS_LABEL[s] }))
const OPCOES_CATEGORIA = CATEGORIAS_LISTA.map((c) => ({ value: c, label: CATEGORIA_LABEL[c] }))

export function FiltrosBar({ filtros, erroPeriodo, temFiltros, onChange, onLimpar }: FiltrosBarProps) {
  // No celular os filtros além da busca ficam recolhidos, para não empurrar a lista para fora da tela.
  // Em telas maiores o painel é sempre visível. Se houver erro no período, o painel abre sozinho.
  const [aberto, setAberto] = useState(false)
  const painelId = useId()
  const painelVisivel = aberto || erroPeriodo !== null
  const extrasAtivos = [filtros.status, filtros.categoria, filtros.de, filtros.ate].filter(Boolean).length

  return (
    <Card>
      <form
        role="search"
        aria-label="Filtros de solicitações"
        onSubmit={(e) => e.preventDefault()}
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div className="sm:col-span-2 lg:col-span-4">
          <Input
            type="search"
            label="Buscar pelo título"
            placeholder="Digite parte do título..."
            value={filtros.busca ?? ''}
            maxLength={LIMITE_BUSCA} // o mesmo limite da API: um texto maior (colado, por exemplo) responderia 400
            onChange={(e) => onChange({ busca: e.target.value })}
          />
        </div>

        <div className="sm:hidden">
          <Button variant="secondary" fullWidth aria-expanded={painelVisivel} aria-controls={painelId} onClick={() => setAberto(!aberto)}>
            {painelVisivel ? 'Ocultar filtros' : 'Mais filtros'}
            {extrasAtivos > 0 && <Badge tone="primary">{extrasAtivos}</Badge>}
          </Button>
        </div>

        {/* "contents" faz os filhos participarem da grade como se esta caixa não existisse. */}
        <div id={painelId} className={cn('sm:contents', painelVisivel ? 'contents' : 'hidden')}>
          <Select
            label="Status"
            placeholder="Todos"
            options={OPCOES_STATUS}
            value={filtros.status ?? ''}
            onChange={(e) => onChange({ status: e.target.value as FiltrosSolicitacao['status'] })}
          />
          <Select
            label="Categoria"
            placeholder="Todas"
            options={OPCOES_CATEGORIA}
            value={filtros.categoria ?? ''}
            onChange={(e) => onChange({ categoria: e.target.value as FiltrosSolicitacao['categoria'] })}
          />
          <Input
            type="date"
            label="Aberta a partir de"
            value={filtros.de ?? ''}
            onChange={(e) => onChange({ de: e.target.value })}
            error={erroPeriodo ?? undefined}
          />
          <Input type="date" label="Aberta até" value={filtros.ate ?? ''} onChange={(e) => onChange({ ate: e.target.value })} />
        </div>

        {temFiltros && (
          <div className="sm:col-span-2 lg:col-span-4">
            <Button variant="ghost" size="sm" onClick={onLimpar}>
              Limpar filtros
            </Button>
          </div>
        )}
      </form>
    </Card>
  )
}
