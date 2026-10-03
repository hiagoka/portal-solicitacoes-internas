import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'
import { fonts, palettes, radii, shadows, type Palette } from './src/styles/theme.ts'

// Transforma uma paleta em variáveis CSS: { primary } → --color-primary, { status.aberto } → --color-status-aberto
function colorVars(palette: Palette): Record<string, string> {
  const { status, ...flat } = palette
  const vars: Record<string, string> = {}
  for (const [nome, valor] of Object.entries(flat)) vars[`--color-${nome}`] = valor
  for (const [nome, valor] of Object.entries(status)) vars[`--color-status-${nome}`] = valor
  return vars
}

function shadowVars(modo: keyof typeof shadows): Record<string, string> {
  return Object.fromEntries(Object.entries(shadows[modo]).map(([nome, valor]) => [`--shadow-${nome}`, valor]))
}

// Nomes de cor usados nas classes (bg-primary, text-textMuted, bg-status-aberto...).
// Cada um aponta para a variável CSS, que muda entre claro e escuro.
const cores = Object.fromEntries([
  ...Object.keys(palettes.light)
    .filter((nome) => nome !== 'status')
    .map((nome) => [nome, `var(--color-${nome})`]),
  ['status', Object.fromEntries(Object.keys(palettes.light.status).map((nome) => [nome, `var(--color-status-${nome})`]))],
])

const config: Config = {
  content: [], // o Tailwind v4 detecta os arquivos sozinho
  theme: {
    colors: { ...cores, transparent: 'transparent', current: 'currentColor' },
    fontFamily: { sans: [...fonts.sans], mono: [...fonts.mono] },
    borderRadius: { none: '0', ...radii },
    boxShadow: {
      none: 'none',
      sm: 'var(--shadow-sm)',
      md: 'var(--shadow-md)',
      lg: 'var(--shadow-lg)',
    },
  },
  plugins: [
    // Emite as variáveis das duas paletas: :root (claro) e .dark (escuro).
    plugin(({ addBase }) => {
      addBase({
        ':root': { ...colorVars(palettes.light), ...shadowVars('light'), colorScheme: 'light' },
        '.dark': { ...colorVars(palettes.dark), ...shadowVars('dark'), colorScheme: 'dark' },
      })
    }),
  ],
}

export default config
