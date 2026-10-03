type ClasseCondicional = string | false | null | undefined

// Junta nomes de classe ignorando valores vazios: cn('a', cond && 'b') → 'a b' ou 'a'.
export function cn(...classes: ClasseCondicional[]): string {
  return classes.filter(Boolean).join(' ')
}
