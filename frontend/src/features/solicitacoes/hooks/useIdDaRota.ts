import { useParams } from 'react-router'
import { lerIdDaRota } from '../utils/idDaRota'

// Lê ":id" da URL como número. Devolve NaN se não for um código válido (a página trata como "não encontrada").
export function useIdDaRota(): number {
  const { id } = useParams()
  return lerIdDaRota(id)
}
