import { Link } from 'react-router'
import { CATEGORIA_LABEL, ROTAS } from '@/constants'
import { formatarCodigo, formatarData } from '@/lib/formatar'
import type { Solicitacao } from '@/types'
import { SolicitacaoCard } from './SolicitacaoCard'
import { StatusBadge } from './StatusBadge'

const COLUNAS = ['Código', 'Título', 'Categoria', 'Solicitante', 'Abertura', 'Status']

// Tabela em telas médias e grandes; cartões em telas pequenas (só um dos dois aparece, o outro fica com display:none
// e, por isso, também fica fora da leitura de leitores de tela).
export function SolicitacaoTable({ solicitacoes }: { solicitacoes: Solicitacao[] }) {
  return (
    <>
      <ul className="divide-y divide-border md:hidden" aria-label="Solicitações">
        {solicitacoes.map((s) => (
          <SolicitacaoCard key={s.id} solicitacao={s} />
        ))}
      </ul>

      <div className="hidden overflow-x-auto md:block">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <caption className="sr-only">Lista de solicitações</caption>
          <thead className="border-b border-border text-xs uppercase tracking-wide text-textMuted">
            <tr>
              {COLUNAS.map((coluna) => (
                <th key={coluna} scope="col" className="px-4 py-3 font-medium">
                  {coluna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {solicitacoes.map((s) => (
              <tr key={s.id} className="hover:bg-background">
                <td className="whitespace-nowrap px-4 py-3 font-mono text-textMuted">{formatarCodigo(s.id)}</td>
                <td className="px-4 py-3">
                  <Link to={ROTAS.detalhesSolicitacao(s.id)} className="font-medium text-text hover:text-primary hover:underline">
                    {s.titulo}
                  </Link>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-textMuted">{CATEGORIA_LABEL[s.categoria]}</td>
                <td className="whitespace-nowrap px-4 py-3 text-textMuted">{s.solicitante.nome}</td>
                <td className="whitespace-nowrap px-4 py-3 text-textMuted">{formatarData(s.criadoEm)}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={s.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
