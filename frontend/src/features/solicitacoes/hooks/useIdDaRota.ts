import { useParams } from 'react-router'

// Lê ":id" da URL como número. Retorna NaN se não for um inteiro positivo (a página trata como "não encontrada").
export function useIdDaRota(): number {
  const { id } = useParams()
  return /^\d+$/.test(id ?? '') && Number(id) > 0 ? Number(id) : NaN
}
