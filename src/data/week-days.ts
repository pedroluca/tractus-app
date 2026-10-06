export const WEEK_DAYS = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'] as const

export type WeekDay = typeof WEEK_DAYS[number]

const DAY_KEYS: Record<string, WeekDay> = {
  domingo: 'Domingo',
  segunda: 'Segunda-feira',
  terca: 'Terça-feira',
  quarta: 'Quarta-feira',
  quinta: 'Quinta-feira',
  sexta: 'Sexta-feira',
  sabado: 'Sábado',
}

// Remove acentos, caixa e espaços das pontas: "  Terça " -> "terca"
export function normalizeText(value: string): string {
  return value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
}

// Aceita "Segunda-feira", "segunda", "SEGUNDA FEIRA", "seg", "sabado"...
export function normalizeDay(value: unknown): WeekDay | null {
  if (typeof value !== 'string') return null
  const key = normalizeText(value).replace(/[\s-]*feira$/, '').replace(/\.$/, '').trim()
  if (!key) return null
  if (DAY_KEYS[key]) return DAY_KEYS[key]

  if (key.length >= 3) {
    const matches = Object.keys(DAY_KEYS).filter(dayKey => dayKey.startsWith(key))
    if (matches.length === 1) return DAY_KEYS[matches[0]]
  }

  return null
}

export function compareWeekDays(a: string, b: string): number {
  return WEEK_DAYS.indexOf(a as WeekDay) - WEEK_DAYS.indexOf(b as WeekDay)
}
