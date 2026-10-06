import type { ParsedWorkout, RawExercise, RawWorkout } from './workout-transfer'
import { normalizeDay, normalizeText, WEEK_DAYS, type WeekDay } from './week-days'

type Delimiter = ';' | ',' | '\t'

type ColumnKey = 'dia' | 'musculo' | 'titulo' | 'series' | 'repeticoes' | 'peso' | 'tempoIntervalo' | 'progressiveSets' | 'nota'

// Nomes aceitos no cabeçalho (sem acento, sem espaço). Vale o alias mais longo que for prefixo do título da coluna,
// então "Peso (kg)" -> "pesokg" -> peso, e "Séries progressivas" -> progressiveSets (e não series).
const COLUMN_ALIASES: Record<ColumnKey, string[]> = {
  dia: ['dia', 'day'],
  musculo: ['treino', 'musculo', 'grupo', 'nomedotreino', 'nometreino'],
  titulo: ['exercicio', 'titulo', 'nome', 'exercise'],
  series: ['series', 'serie', 'sets'],
  repeticoes: ['repeticoes', 'repeticao', 'reps', 'rep'],
  peso: ['peso', 'carga', 'kg'],
  tempoIntervalo: ['descanso', 'intervalo', 'tempointervalo', 'tempo', 'pausa'],
  progressiveSets: ['progressao', 'progressivo', 'seriesprogressivas'],
  nota: ['nota', 'obs', 'observacao'],
}

const CSV_HEADER = ['dia', 'treino', 'exercicio', 'series', 'repeticoes', 'peso', 'descanso', 'progressao', 'nota']

// Byte order mark: faz o Excel abrir o CSV como UTF-8 (sem ele os acentos quebram)
const BOM = String.fromCharCode(0xFEFF)

// Modelo baixado pelo usuário: mostra a herança do dia/treino da linha de cima e os formatos aceitos
export const CSV_TEMPLATE = BOM + [
  CSV_HEADER.join(';'),
  'Segunda-feira;Peito e Tríceps;Supino Reto com Barra;4;10;40;1:30;;',
  ';;Crucifixo com Halter;3;12;12,5;1:00;;Cotovelos levemente flexionados',
  ';;Tríceps na Polia;3;;;1:00;12x20 / 10x25 / 8x30;',
  'Quarta-feira;Costas e Bíceps;Puxada Alta;4;10;45;1:30;;',
  ';;Rosca Direta com Barra;3;10;15;1:00;;',
].join('\r\n')

// ─── Leitura ──────────────────────────────────────────────────────────────────

function detectDelimiter(text: string): Delimiter {
  const firstLine = text.split(/\r?\n/).find(line => line.trim()) ?? ''
  if (firstLine.includes('\t')) return '\t'
  const semicolons = firstLine.split(';').length - 1
  const commas = firstLine.split(',').length - 1
  return commas > semicolons ? ',' : ';'
}

// Parser CSV no padrão RFC 4180: campos entre aspas podem conter delimitador, quebra de linha e "" (aspas escapadas)
export function parseDelimited(text: string): string[][] {
  const source = text.startsWith(BOM) ? text.slice(1) : text
  const delimiter = detectDelimiter(source)
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false

  for (let i = 0; i < source.length; i++) {
    const char = source[i]

    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += char
      }
    } else if (char === '"' && field.trim() === '') {
      field = ''
      inQuotes = true
    } else if (char === delimiter) {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && source[i + 1] === '\n') i++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }

  if (field !== '' || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows
}

function headerKey(cell: string): ColumnKey | null {
  const normalized = normalizeText(cell).replace(/[^a-z0-9]/g, '')
  if (!normalized) return null

  let best: { key: ColumnKey; length: number } | null = null
  for (const [key, aliases] of Object.entries(COLUMN_ALIASES) as [ColumnKey, string[]][]) {
    for (const alias of aliases) {
      if (normalized.startsWith(alias) && (!best || alias.length > best.length)) {
        best = { key, length: alias.length }
      }
    }
  }
  return best?.key ?? null
}

// Desfaz a proteção contra fórmula aplicada no export ("'=..." -> "=...")
function unescapeText(value: string): string {
  return /^'[=+\-@]/.test(value) ? value.slice(1) : value
}

export type CsvAdapterResult = {
  workouts: RawWorkout[]
  errors: string[]
  warnings: string[]
}

// Converte as linhas da planilha (uma por exercício) no mesmo formato cru do JSON, agrupando por dia
export function rowsToRawWorkouts(rows: string[][]): CsvAdapterResult {
  const errors: string[] = []
  const warnings: string[] = []

  const headerIndex = rows.findIndex(row => row.some(cell => cell.trim()))
  if (headerIndex === -1) {
    return { workouts: [], errors: ['A planilha está vazia.'], warnings }
  }

  const columns = new Map<ColumnKey, number>()
  rows[headerIndex].forEach((cell, index) => {
    const key = headerKey(cell)
    if (key && !columns.has(key)) columns.set(key, index)
  })

  if (!columns.has('dia') || !columns.has('titulo')) {
    return {
      workouts: [],
      errors: ['A primeira linha da planilha precisa ter os títulos das colunas, com pelo menos "dia" e "exercicio". Baixe o modelo de planilha para ver o formato.'],
      warnings,
    }
  }

  const groups = new Map<WeekDay, { musculo: string; firstLine: number; exercicios: RawExercise[] }>()
  let currentDay: WeekDay | null = null
  let skippingInvalidDay = false

  for (let i = headerIndex + 1; i < rows.length; i++) {
    const row = rows[i]
    const line = i + 1
    if (row.every(cell => !cell.trim())) continue

    const cell = (key: ColumnKey) => {
      const index = columns.get(key)
      return index === undefined ? '' : unescapeText((row[index] ?? '').trim())
    }

    // Dia vazio herda o da linha de cima
    const diaCell = cell('dia')
    if (diaCell) {
      const day = normalizeDay(diaCell)
      if (!day) {
        errors.push(`Linha ${line}: dia "${diaCell}" não reconhecido. Use ${WEEK_DAYS.join(', ')}.`)
        currentDay = null
        skippingInvalidDay = true
        continue
      }
      currentDay = day
      skippingInvalidDay = false
    } else if (!currentDay) {
      if (!skippingInvalidDay) errors.push(`Linha ${line}: falta o dia da semana.`)
      continue
    }

    let group = groups.get(currentDay)
    if (!group) {
      group = { musculo: '', firstLine: line, exercicios: [] }
      groups.set(currentDay, group)
    }

    const treinoCell = cell('musculo')
    if (treinoCell) {
      if (!group.musculo) {
        group.musculo = treinoCell
      } else if (normalizeText(treinoCell) !== normalizeText(group.musculo)) {
        warnings.push(`Linha ${line}: treino "${treinoCell}" é diferente de "${group.musculo}" em ${currentDay}; mantive "${group.musculo}".`)
      }
    }

    const details: Record<string, string> = {}
    for (const key of ['series', 'repeticoes', 'peso', 'tempoIntervalo', 'progressiveSets', 'nota'] as const) {
      const value = cell(key)
      if (value) details[key] = value
    }

    const titulo = cell('titulo')
    if (!titulo) {
      // Linha só com dia/treino apenas declara o dia (treino sem exercícios)
      if (Object.keys(details).length > 0) errors.push(`Linha ${line}: falta o nome do exercício.`)
      continue
    }

    group.exercicios.push({ where: `Linha ${line}`, data: { titulo, ...details } })
  }

  const workouts: RawWorkout[] = [...groups.entries()].map(([dia, group]) => ({
    dia,
    musculo: group.musculo,
    exercicios: group.exercicios,
    where: `Linha ${group.firstLine} (${dia})`,
  }))

  return { workouts, errors, warnings }
}

// ─── Progressão e descanso em texto ──────────────────────────────────────────

// "12x40 / 10x45 / 8x42,5" -> [{ reps: 12, weight: 40 }, ...]
export function parseProgressionText(text: string): { sets: { reps: number; weight: number }[] } | { error: string } {
  const parts = text.split(/[/;|\n]/).map(part => part.trim()).filter(Boolean)
  const sets: { reps: number; weight: number }[] = []

  for (const part of parts) {
    const match = part.match(/^(\d+)\s*(?:reps?)?\s*[x×*]\s*(\d+(?:[.,]\d+)?)\s*(?:kg)?$/i)
    if (!match) return { error: part }
    sets.push({ reps: Number(match[1]), weight: Number(match[2].replace(',', '.')) })
  }

  return { sets }
}

export function formatDecimal(value: number): string {
  return String(value).replace('.', ',')
}

export function formatRestTime(seconds: number): string {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}

// ─── Escrita ─────────────────────────────────────────────────────────────────

function escapeCell(value: string, isText: boolean): string {
  // Evita que o Excel interprete texto como fórmula (CSV injection)
  const safe = isText && /^[=+\-@]/.test(value) ? `'${value}` : value
  return /[;"\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

// Separador ";", vírgula decimal e BOM UTF-8 para abrir direto no Excel pt-BR sem quebrar acentos nem números
export function workoutsToCsv(treinos: ParsedWorkout[]): string {
  const lines = [CSV_HEADER.join(';')]

  for (const treino of treinos) {
    const text = (value: string) => escapeCell(value, true)

    if (treino.exercicios.length === 0) {
      lines.push([text(treino.dia), text(treino.musculo), '', '', '', '', '', '', ''].join(';'))
      continue
    }

    for (const exercicio of treino.exercicios) {
      const progression = exercicio.usesProgressiveWeight && exercicio.progressiveSets
        ? exercicio.progressiveSets.map(set => `${set.reps}x${formatDecimal(set.weight)}`).join(' / ')
        : ''

      lines.push([
        text(treino.dia),
        text(treino.musculo),
        text(exercicio.titulo),
        String(exercicio.series),
        String(exercicio.repeticoes),
        formatDecimal(exercicio.peso),
        formatRestTime(exercicio.tempoIntervalo),
        progression,
        text(exercicio.nota ?? ''),
      ].join(';'))
    }
  }

  return BOM + lines.join('\r\n')
}
