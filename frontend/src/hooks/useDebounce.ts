import { useEffect, useState } from 'react'

// Devolve `valor` só depois de ele ficar parado por `atrasoMs`. Evita uma requisição por tecla digitada.
export function useDebounce<T>(valor: T, atrasoMs = 300): T {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const temporizador = window.setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => window.clearTimeout(temporizador)
  }, [valor, atrasoMs])

  return atrasado
}
