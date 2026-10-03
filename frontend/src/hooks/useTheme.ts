import { useCallback, useState } from 'react'

export type Theme = 'light' | 'dark'

// Mesma chave usada pelo script em index.html, que aplica o tema antes do React carregar.
const STORAGE_KEY = 'tema'

function temaAtual(): Theme {
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light'
}

// Alterna entre claro e escuro. O tema inicial já foi aplicado no <html> pelo script do index.html
// (preferência salva ou, na primeira visita, a do sistema operacional).
export function useTheme() {
  const [theme, setTheme] = useState<Theme>(temaAtual)

  const toggle = useCallback(() => {
    const proximo: Theme = temaAtual() === 'dark' ? 'light' : 'dark'
    document.documentElement.classList.toggle('dark', proximo === 'dark')
    setTheme(proximo)
    try {
      localStorage.setItem(STORAGE_KEY, proximo)
    } catch {
      // navegação privada ou armazenamento bloqueado: o tema vale só nesta sessão
    }
  }, [])

  return { theme, isDark: theme === 'dark', toggle }
}
