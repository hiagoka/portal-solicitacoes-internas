import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigationType, useSearchParams } from 'react-router'
import { useDebounce } from '@/hooks'
import type { FiltrosSolicitacao } from '@/types'
import { estadoPadrao, lerEstadoDaUrl, paraParametrosDaUrl, type CamposDeFiltro, type EstadoDaLista } from '../utils/filtrosUrl'

export { OPCOES_POR_PAGINA } from '../utils/filtrosUrl'

// Filtros e paginação da listagem, guardados na URL: o link da lista filtrada pode ser copiado e compartilhado,
// recarregar a página mantém tudo e o botão "voltar" (depois de abrir uma solicitação) devolve a lista como estava.
//
// Exceção deliberada: o TEXTO da busca também tem estado local. Se o campo fosse controlado só pela URL, que se
// atualiza com um pequeno atraso, teclas digitadas depressa seriam sobrescritas pelo valor antigo (o teste de
// navegador pegou exatamente isso). Assim a digitação nunca atrasa, a URL recebe o texto logo em seguida e o
// campo só é reposto a partir dela quando a mudança vier de FORA (botões voltar/avançar do navegador).
//
// Devolve dois conjuntos:
//  - `filtros`: o que está nos campos agora (atualiza a cada tecla);
//  - `aplicados`: o que de fato vai para a API (a busca espera o usuário parar de digitar).
export function useFiltrosSolicitacoes() {
  const [params, setParams] = useSearchParams()
  const location = useLocation()
  const tipoDeNavegacao = useNavigationType()
  const daUrl = useMemo(() => lerEstadoDaUrl(params), [params])

  const [texto, setTexto] = useState(daUrl.filtros.busca)
  const [chaveVista, setChaveVista] = useState(location.key)
  if (location.key !== chaveVista) {
    // Ajuste durante a renderização (padrão recomendado pelo React): voltar/avançar no histórico (POP) é uma mudança
    // externa, então o campo passa a mostrar o que a URL diz. As gravações da própria tela são REPLACE/PUSH e não entram aqui.
    setChaveVista(location.key)
    if (tipoDeNavegacao === 'POP') setTexto(daUrl.filtros.busca)
  }

  const estado: EstadoDaLista = useMemo(() => ({ ...daUrl, filtros: { ...daUrl.filtros, busca: texto } }), [daUrl, texto])
  const { filtros, pagina, porPagina } = estado
  const buscaAtrasada = useDebounce(texto, 300)

  // `substituir` = troca a entrada atual do histórico em vez de empilhar outra. Filtrar e digitar não devem
  // poluir o "voltar"; já trocar de página é uma navegação de verdade e empilha.
  const gravar = useCallback(
    (proximo: EstadoDaLista, substituir: boolean) => setParams(paraParametrosDaUrl(proximo), { replace: substituir }),
    [setParams],
  )

  // Mudar qualquer filtro volta à primeira página: a página 5 do resultado antigo não faz sentido no novo.
  const alterar = useCallback(
    (alteracao: Partial<CamposDeFiltro>) => {
      if (alteracao.busca !== undefined) setTexto(alteracao.busca)
      gravar({ ...estado, filtros: { ...filtros, ...alteracao }, pagina: 1 }, true)
    },
    [estado, filtros, gravar],
  )
  const limpar = useCallback(() => {
    setTexto('')
    gravar({ ...estado, filtros: estadoPadrao().filtros, pagina: 1 }, true)
  }, [estado, gravar])
  const irParaPagina = useCallback((nova: number) => gravar({ ...estado, pagina: nova }, false), [estado, gravar])
  // Mudar o tamanho também volta ao início (o item da posição 31 muda de página).
  const alterarPorPagina = useCallback((valor: number) => gravar({ ...estado, porPagina: valor, pagina: 1 }, true), [estado, gravar])

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

  return { filtros, aplicados, erroPeriodo, temFiltros, alterar, limpar, pagina, porPagina, irParaPagina, alterarPorPagina }
}
