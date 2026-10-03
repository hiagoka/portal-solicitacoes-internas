import { Pagination, Select } from '@/components/ui'
import { formatarIntervalo } from '@/lib/formatar'
import type { Paginacao } from '@/types'
import { OPCOES_POR_PAGINA } from '../hooks'

type PaginacaoListagemProps = {
  paginacao: Paginacao
  /** Bloqueia a navegação enquanto uma nova página carrega. */
  carregando: boolean
  onPagina: (pagina: number) => void
  onPorPagina: (porPagina: number) => void
}

const OPCOES = OPCOES_POR_PAGINA.map((n) => ({ value: String(n), label: String(n) }))

// Rodapé da listagem: faixa exibida, tamanho da página e botões Anterior/Próxima.
export function PaginacaoListagem({ paginacao, carregando, onPagina, onPorPagina }: PaginacaoListagemProps) {
  const { pagina, porPagina, total, totalPaginas } = paginacao

  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-border px-4 py-3">
      <p className="text-sm text-textMuted">Mostrando {formatarIntervalo(pagina, porPagina, total)}</p>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
        <div className="flex items-center gap-2">
          <label htmlFor="por-pagina" className="text-sm text-textMuted">
            Por página
          </label>
          <div className="w-20">
            <Select id="por-pagina" options={OPCOES} value={String(porPagina)} onChange={(e) => onPorPagina(Number(e.target.value))} />
          </div>
        </div>
        <Pagination pagina={pagina} totalPaginas={totalPaginas} onChange={onPagina} disabled={carregando} />
      </div>
    </div>
  )
}
