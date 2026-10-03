import type { Categoria } from '@/types'

export const CATEGORIAS_LISTA: readonly Categoria[] = ['TI', 'RH', 'Compras', 'Financeiro', 'Infraestrutura']

export const CATEGORIA_LABEL: Record<Categoria, string> = {
  TI: 'TI',
  RH: 'RH',
  Compras: 'Compras',
  Financeiro: 'Financeiro',
  Infraestrutura: 'Infraestrutura',
}
