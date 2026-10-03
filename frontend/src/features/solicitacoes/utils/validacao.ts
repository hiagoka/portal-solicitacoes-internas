import { CATEGORIAS_LISTA } from '@/constants'
import type { SolicitacaoInput } from '@/types'

export type ValoresFormulario = Omit<SolicitacaoInput, 'categoria'> & { categoria: SolicitacaoInput['categoria'] | '' }
export type ErrosFormulario = Partial<Record<keyof SolicitacaoInput, string>>

export const LIMITE_TITULO = 150
export const LIMITE_DESCRICAO = 5000

// Mesmas regras da API (backend/src/schemas/solicitacao.schema.ts). Validar aqui dá resposta imediata
// ao usuário; a API continua sendo a autoridade e devolve 400 se algo passar.
export function validarSolicitacao(valores: ValoresFormulario): ErrosFormulario {
  const erros: ErrosFormulario = {}
  const titulo = valores.titulo.trim()
  const descricao = valores.descricao.trim()

  if (titulo.length < 3) erros.titulo = 'O título precisa ter ao menos 3 caracteres.'
  else if (titulo.length > LIMITE_TITULO) erros.titulo = `O título pode ter no máximo ${LIMITE_TITULO} caracteres.`

  if (!descricao) erros.descricao = 'Informe a descrição.'
  else if (descricao.length > LIMITE_DESCRICAO) erros.descricao = `A descrição pode ter no máximo ${LIMITE_DESCRICAO} caracteres.`

  if (!CATEGORIAS_LISTA.includes(valores.categoria as never)) erros.categoria = 'Selecione a categoria.'

  return erros
}
