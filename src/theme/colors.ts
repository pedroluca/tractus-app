import { useCSSVariable } from 'uniwind'

/** Cores primárias disponíveis na personalização (Premium) */
export const PRIMARY_COLORS = [
  { name: 'Verde', hex: '#27AE60', strong: '#219150' },
  { name: 'Azul', hex: '#2980B9', strong: '#2471A3' },
  { name: 'Roxo', hex: '#8E44AD', strong: '#7D3C98' },
  { name: 'Vermelho', hex: '#E74C3C', strong: '#CB4335' },
  { name: 'Laranja', hex: '#E67E22', strong: '#CA6F1E' },
  { name: 'Rosa', hex: '#E91E8C', strong: '#C2185B' },
  { name: 'Ciano', hex: '#00BCD4', strong: '#0097A7' },
] as const

export const DEFAULT_PRIMARY = PRIMARY_COLORS[0]

const TOKENS = [
  '--color-primary',
  '--color-primary-strong',
  '--color-on-primary',
  '--color-background',
  '--color-surface',
  '--color-surface-2',
  '--color-surface-3',
  '--color-border',
  '--color-foreground',
  '--color-muted',
  '--color-subtle',
  '--color-danger',
  '--color-warning',
  '--color-info',
  '--color-success',
  '--color-streak',
  '--color-premium',
  '--color-founder',
] as const

export type ThemeColors = {
  primary: string
  primaryStrong: string
  onPrimary: string
  background: string
  surface: string
  surface2: string
  surface3: string
  border: string
  foreground: string
  muted: string
  subtle: string
  danger: string
  warning: string
  info: string
  success: string
  streak: string
  premium: string
  founder: string
}

/**
 * Cores do tema atual para props que não aceitam className
 * (ícones, gráficos, header nativo, Switch...). Reage à troca de tema e de cor primária.
 */
export function useThemeColors(): ThemeColors {
  const values = useCSSVariable([...TOKENS]).map(value => String(value ?? '#000000'))
  return {
    primary: values[0],
    primaryStrong: values[1],
    onPrimary: values[2],
    background: values[3],
    surface: values[4],
    surface2: values[5],
    surface3: values[6],
    border: values[7],
    foreground: values[8],
    muted: values[9],
    subtle: values[10],
    danger: values[11],
    warning: values[12],
    info: values[13],
    success: values[14],
    streak: values[15],
    premium: values[16],
    founder: values[17],
  }
}

/** Mesma cor com transparência (#RRGGBB + alpha em hex) */
export function withAlpha(hex: string, alpha: number): string {
  if (!hex.startsWith('#') || hex.length !== 7) return hex
  const value = Math.round(Math.min(1, Math.max(0, alpha)) * 255).toString(16).padStart(2, '0')
  return `${hex}${value}`
}
