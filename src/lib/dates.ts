/** YYYY-MM-DD no horário local (toISOString usaria UTC e viraria o dia antes da hora) */
export function getLocalDateKey(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/** Interpreta YYYY-MM-DD como data local */
export function parseDateKey(key: string): Date | null {
  const [year, month, day] = key.split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function isBirthdayToday(birthDate: string, reference = new Date()): boolean {
  const [year, month, day] = birthDate.split('-')
  if (!year || !month || !day) return false
  return Number(month) === reference.getMonth() + 1 && Number(day) === reference.getDate()
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return getLocalDateKey(a) === getLocalDateKey(b)
}

export function isWithinLastDays(iso: string, days: number): boolean {
  const time = new Date(iso).getTime()
  return Date.now() - time <= days * 24 * 60 * 60 * 1000
}

export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

export function formatRest(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} min` : `${minutes}:${String(rest).padStart(2, '0')} min`
}

export function formatDate(iso: string, options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' }) {
  return new Date(iso).toLocaleDateString('pt-BR', options)
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

/** "Hoje", "Ontem" ou "segunda-feira, 3 de outubro" */
export function formatRelativeDay(dateKey: string): string {
  const today = getLocalDateKey()
  const yesterdayDate = new Date()
  yesterdayDate.setDate(yesterdayDate.getDate() - 1)
  if (dateKey === today) return 'Hoje'
  if (dateKey === getLocalDateKey(yesterdayDate)) return 'Ontem'
  const date = parseDateKey(dateKey)
  if (!date) return dateKey
  const label = date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
  return label.charAt(0).toUpperCase() + label.slice(1)
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toFixed(digits).replace('.', ',')
}

/** Número sem casas decimais desnecessárias: 40 -> "40", 12.5 -> "12,5" */
export function formatWeight(value: number): string {
  return Number.isInteger(value) ? String(value) : String(value).replace('.', ',')
}
