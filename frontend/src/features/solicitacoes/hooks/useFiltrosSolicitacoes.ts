import { useCallback, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks'
import type { FiltrosSolicitacao } from '@/types'

const VAZIO: FiltrosSolicitacao = { busca: '', status: '', categoria: '', de: '', ate: '' }

// Estado dos filtros da listagem. Devolve dois conjuntos:
//  - `filtros`: o que está nos campos agora (atualiza a cada tecla);
//  - `aplicados`: o que de fato vai para a API (a busca espera o usuário parar de digitar).
export function useFiltrosSolicitacoes() {
  const [filtros, setFiltros] = useState<FiltrosSolicitacao>(VAZIO)
  const buscaAtrasada = useDebounce(filtros.busca ?? '', 300)

  const alterar = useCallback((alteracao: Partial<FiltrosSolicitacao>) => {
    setFiltros((atuais) => ({ ...atuais, ...alteracao }))
  }, [])

  const limpar = useCallback(() => setFiltros(VAZIO), [])

  // Período invertido não é enviado (a API responderia 400); o usuário vê o aviso no campo.
  const erroPeriodo =
    filtros.de && filtros.ate && filtros.de > filtros.ate ? 'A data inicial não pode ser maior que a final.' : null

  const aplicados = useMemo<FiltrosSolicitacao>(
    () => ({
      status: filtros.status,
      categoria: filtros.categoria,
      busca: buscaAtrasada.trim(),
      de: erroPeriodo ? '' : filtros.de,
      ate: erroPeriodo ? '' : filtros.ate,
    }),
    [filtros.status, filtros.categoria, filtros.de, filtros.ate, buscaAtrasada, erroPeriodo],
  )

  const temFiltros = Object.values(filtros).some((valor) => !!valor)

  return { filtros, aplicados, erroPeriodo, temFiltros, alterar, limpar }
}
