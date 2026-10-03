import { useCallback, useMemo, useState } from 'react'
import { useDebounce } from '@/hooks'
import type { FiltrosSolicitacao } from '@/types'

type CamposDeFiltro = Omit<FiltrosSolicitacao, 'pagina' | 'porPagina'>

const VAZIO: CamposDeFiltro = { busca: '', status: '', categoria: '', de: '', ate: '' }
export const OPCOES_POR_PAGINA = [5, 10, 20, 50] as const
const POR_PAGINA_PADRAO = 10

// Estado dos filtros e da paginação da listagem. Devolve dois conjuntos:
//  - `filtros`: o que está nos campos agora (atualiza a cada tecla);
//  - `aplicados`: o que de fato vai para a API (a busca espera o usuário parar de digitar).
export function useFiltrosSolicitacoes() {
  const [filtros, setFiltros] = useState<CamposDeFiltro>(VAZIO)
  const [pagina, setPagina] = useState(1)
  const [porPagina, setPorPagina] = useState<number>(POR_PAGINA_PADRAO)
  const buscaAtrasada = useDebounce(filtros.busca ?? '', 300)

  // Mudar qualquer filtro volta à primeira página: a página 5 do resultado antigo não faz sentido no novo.
  const alterar = useCallback((alteracao: Partial<CamposDeFiltro>) => {
    setFiltros((atuais) => ({ ...atuais, ...alteracao }))
    setPagina(1)
  }, [])

  const limpar = useCallback(() => {
    setFiltros(VAZIO)
    setPagina(1)
  }, [])

  // Mudar o tamanho da página também volta ao início (o item da posição 31 muda de página).
  const alterarPorPagina = useCallback((valor: number) => {
    setPorPagina(valor)
    setPagina(1)
  }, [])

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
      pagina,
      porPagina,
    }),
    [filtros.status, filtros.categoria, filtros.de, filtros.ate, buscaAtrasada, erroPeriodo, pagina, porPagina],
  )

  // Só os filtros contam: estar na página 3 ou ver 50 por página não é "ter filtros ativos".
  const temFiltros = Object.values(filtros).some((valor) => !!valor)

  return { filtros, aplicados, erroPeriodo, temFiltros, alterar, limpar, pagina, porPagina, irParaPagina: setPagina, alterarPorPagina }
}
