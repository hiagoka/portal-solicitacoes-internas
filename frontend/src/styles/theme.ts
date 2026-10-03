// ÚNICA fonte de cores, fontes, raios e sombras da aplicação.
// O Tailwind lê este arquivo (tailwind.config.ts); os componentes só usam os nomes semânticos
// (bg-surface, text-textMuted, bg-status-aberto...), nunca valores soltos.
//
// As duas paletas têm exatamente as mesmas chaves. O tipo `Palette` obriga o tema escuro
// a definir tudo que o claro define (esquecer uma cor vira erro de compilação).

export interface Palette {
  primary: string
  primaryHover: string
  onPrimary: string // texto sobre fundo primary
  secondary: string
  background: string // fundo da página
  surface: string // cards, tabelas, modais
  text: string
  textMuted: string
  border: string
  overlay: string // fundo escurecido atrás do modal
  success: string
  warning: string
  danger: string
  dangerHover: string
  status: {
    aberto: string
    emAtendimento: string
    concluido: string
  }
}

const light: Palette = {
  primary: '#4F46E5',
  primaryHover: '#4338CA',
  onPrimary: '#FFFFFF',
  secondary: '#475569',
  background: '#F1F5F9',
  surface: '#FFFFFF',
  text: '#0F172A',
  textMuted: '#526077',
  border: '#E2E8F0',
  overlay: 'rgb(15 23 42 / 0.5)',
  success: '#15803D',
  warning: '#B45309',
  danger: '#B91C1C',
  dangerHover: '#991B1B',
  status: {
    aberto: '#0369A1',
    emAtendimento: '#B45309',
    concluido: '#15803D',
  },
}

const dark: Palette = {
  primary: '#818CF8',
  primaryHover: '#A5B4FC',
  onPrimary: '#0B1020', // fundo primary é claro no escuro, então o texto é escuro
  secondary: '#94A3B8',
  background: '#0B1120',
  surface: '#131C31',
  text: '#E2E8F0',
  textMuted: '#94A3B8',
  border: '#27344D',
  overlay: 'rgb(0 0 0 / 0.65)',
  success: '#4ADE80',
  warning: '#FBBF24',
  danger: '#F87171',
  dangerHover: '#FCA5A5',
  status: {
    aberto: '#38BDF8',
    emAtendimento: '#FBBF24',
    concluido: '#4ADE80',
  },
}

export const palettes = { light, dark } as const

export const fonts = {
  sans: ['ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
  mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'], // código da solicitação
} as const

export const radii = { sm: '4px', md: '8px', lg: '12px', full: '9999px' } as const

// Sombras mais fortes no escuro, onde uma sombra suave quase não aparece.
export const shadows = {
  light: {
    sm: '0 1px 2px 0 rgb(15 23 42 / 0.06)',
    md: '0 4px 12px -2px rgb(15 23 42 / 0.10)',
    lg: '0 12px 32px -8px rgb(15 23 42 / 0.20)',
  },
  dark: {
    sm: '0 1px 2px 0 rgb(0 0 0 / 0.40)',
    md: '0 4px 12px -2px rgb(0 0 0 / 0.50)',
    lg: '0 12px 32px -8px rgb(0 0 0 / 0.60)',
  },
} as const
