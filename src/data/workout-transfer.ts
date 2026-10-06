import { collection, doc, getDocs, query, setDoc, where, writeBatch } from '@react-native-firebase/firestore'
import { File, Paths } from 'expo-file-system'
import * as Sharing from 'expo-sharing'
import { getLocalDateKey } from '@/lib/dates'
import { db } from '@/lib/firebase'
import { updateScheduledDays } from './streak'
import type { ProgressiveSet } from './types'
import { compareWeekDays, normalizeDay, WEEK_DAYS, type WeekDay } from './week-days'
import { CSV_TEMPLATE, parseDelimited, parseProgressionText, rowsToRawWorkouts, workoutsToCsv } from './workout-csv'
import { deleteWorkoutWithExercises, getUserWorkouts, getWorkoutExercises } from './workouts'

export type ParsedExercise = {
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number // segundos
  usesProgressiveWeight: boolean
  progressiveSets?: ProgressiveSet[]
  nota?: string
}

export type ParsedWorkout = {
  dia: WeekDay
  musculo: string
  exercicios: ParsedExercise[]
}

export type WorkoutExportFile = {
  app: 'tractus'
  tipo: 'treinos'
  versao: 1
  exportadoEm: string
  treinos: ParsedWorkout[]
}

// Formato intermediário, antes da validação. `where` identifica a origem nas mensagens de erro
export type RawExercise = { data: Record<string, unknown>; where: string }
export type RawWorkout = { dia: unknown; musculo: unknown; exercicios: RawExercise[]; where: string }

export type TransferFormat = 'json' | 'csv'

export type ImportParseResult =
  | { ok: true; format: TransferFormat; treinos: ParsedWorkout[]; warnings: string[] }
  | { ok: false; errors: string[] }

const MAX_IMPORT_CHARS = 1_000_000
const MAX_EXERCISES_PER_WORKOUT = 100
const DEFAULT_REST_SECONDS = 90

export const JSON_EXAMPLE = `{
  "treinos": [
    {
      "dia": "Segunda-feira",
      "musculo": "Peito e Tríceps",
      "exercicios": [
        { "titulo": "Supino Reto com Barra", "series": 4, "repeticoes": 10, "peso": 40, "tempoIntervalo": 90 },
        {
          "titulo": "Tríceps na Polia",
          "series": 3,
          "tempoIntervalo": 60,
          "progressiveSets": [
            { "reps": 12, "weight": 20 },
            { "reps": 10, "weight": 25 },
            { "reps": 8, "weight": 30 }
          ],
          "nota": "Cotovelos colados no corpo"
        }
      ]
    }
  ]
}`

// ─── Leitura / validação ─────────────────────────────────────────────────────

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

const asText = (value: unknown): string =>
  typeof value === 'string' ? value.trim() : typeof value === 'number' ? String(value) : ''

// undefined = campo vazio; null = valor inválido
function toNumber(value: unknown): number | undefined | null {
  if (value === undefined || value === null) return undefined
  if (typeof value === 'number') return Number.isFinite(value) ? value : null
  if (typeof value !== 'string') return null

  const cleaned = value.trim().replace(/\s+/g, '').replace(/(kg|seg|s|reps?)$/i, '').replace(',', '.')
  if (!cleaned) return undefined
  const parsed = Number(cleaned)
  return Number.isFinite(parsed) ? parsed : null
}

// Aceita segundos (90) ou minutos:segundos ("1:30")
function toRestSeconds(value: unknown): number | undefined | null {
  if (typeof value === 'string') {
    const match = value.trim().match(/^(\d+):(\d{1,2})$/)
    if (match) return Number(match[1]) * 60 + Number(match[2])
  }
  return toNumber(value)
}

function toProgressiveSets(value: unknown): { sets: ProgressiveSet[] } | { error: string } | undefined {
  if (value === undefined || value === null || value === '') return undefined
  if (typeof value === 'string') return parseProgressionText(value)
  if (!Array.isArray(value)) return { error: String(value) }

  const sets: ProgressiveSet[] = []
  for (const item of value) {
    if (!isObject(item)) return { error: JSON.stringify(item) }
    const reps = toNumber(item.reps ?? item.repeticoes)
    const weight = toNumber(item.weight ?? item.peso)
    if (typeof reps !== 'number' || typeof weight !== 'number') return { error: JSON.stringify(item) }
    sets.push({ reps, weight })
  }
  return { sets }
}

function validateExercise(raw: RawExercise, errors: string[], warnings: string[]): ParsedExercise | null {
  const { data, where: at } = raw
  const errorCountBefore = errors.length

  let titulo = asText(data.titulo)
  if (!titulo) {
    errors.push(`${at}: falta o nome do exercício.`)
    return null
  }
  if (titulo.length > 120) {
    titulo = titulo.slice(0, 120)
    warnings.push(`${at}: nome do exercício muito longo, foi cortado em 120 caracteres.`)
  }

  const progression = toProgressiveSets(data.progressiveSets)
  let sets: ProgressiveSet[] = []
  if (progression && 'error' in progression) {
    errors.push(`${at} (${titulo}): progressão de carga inválida em "${progression.error}". Use o formato 12x40 / 10x45 / 8x50.`)
  } else if (progression) {
    sets = progression.sets
    if (sets.some(set => !Number.isInteger(set.reps) || set.reps < 0 || set.reps > 1000 || set.weight < 0 || set.weight > 2000)) {
      errors.push(`${at} (${titulo}): a progressão tem repetições ou pesos fora do intervalo aceito.`)
    }
  }
  const usesProgressiveWeight = data.usesProgressiveWeight !== false && sets.length > 0

  let series: number | undefined | null = toNumber(data.series)
  if (usesProgressiveWeight) {
    if (typeof series === 'number' && series !== sets.length) {
      warnings.push(`${at} (${titulo}): ${series} séries informadas, mas a progressão tem ${sets.length}; usei ${sets.length}.`)
    }
    series = sets.length
  }
  if (series === undefined) {
    errors.push(`${at} (${titulo}): falta o número de séries.`)
  } else if (series === null || !Number.isInteger(series) || series < 1 || series > 50) {
    errors.push(`${at} (${titulo}): séries deve ser um número inteiro entre 1 e 50.`)
  }

  // Campo vazio usa o default; valor inválido (null) vira erro
  const withDefault = (value: number | undefined | null, fallback: number) => value === undefined ? fallback : value

  const repeticoes = withDefault(toNumber(data.repeticoes), usesProgressiveWeight ? sets[0].reps : 0)
  if (repeticoes === null || !Number.isInteger(repeticoes) || repeticoes < 0 || repeticoes > 1000) {
    errors.push(`${at} (${titulo}): repetições deve ser um número inteiro entre 0 e 1000.`)
  }

  const peso = withDefault(toNumber(data.peso), usesProgressiveWeight ? sets[0].weight : 0)
  if (peso === null || peso < 0 || peso > 2000) {
    errors.push(`${at} (${titulo}): peso deve ser um número entre 0 e 2000.`)
  }

  const tempoIntervalo = withDefault(toRestSeconds(data.tempoIntervalo), DEFAULT_REST_SECONDS)
  if (tempoIntervalo === null || tempoIntervalo < 0 || tempoIntervalo > 3600) {
    errors.push(`${at} (${titulo}): descanso deve estar em segundos (ex: 90) ou no formato 1:30, até 60 minutos.`)
  }

  if (errors.length > errorCountBefore) return null

  const exercise: ParsedExercise = {
    titulo,
    series: series as number,
    repeticoes: repeticoes as number,
    peso: peso as number,
    tempoIntervalo: Math.round(tempoIntervalo as number),
    usesProgressiveWeight,
  }
  if (usesProgressiveWeight) exercise.progressiveSets = sets

  const nota = asText(data.nota)
  if (nota) exercise.nota = nota.slice(0, 1000)

  return exercise
}

function validateWorkouts(raws: RawWorkout[], errors: string[], warnings: string[]): ParsedWorkout[] {
  const treinos: ParsedWorkout[] = []
  const seenDays = new Set<WeekDay>()

  for (const raw of raws) {
    const dia = normalizeDay(raw.dia)
    if (!dia) {
      const received = asText(raw.dia)
      errors.push(received
        ? `${raw.where}: dia "${received}" não reconhecido. Use ${WEEK_DAYS.join(', ')}.`
        : `${raw.where}: falta o dia da semana.`)
      continue
    }

    if (seenDays.has(dia)) {
      warnings.push(`${raw.where}: ${dia} aparece mais de uma vez; só o primeiro foi considerado.`)
      continue
    }
    seenDays.add(dia)

    if (raw.exercicios.length > MAX_EXERCISES_PER_WORKOUT) {
      errors.push(`${raw.where}: ${dia} tem mais de ${MAX_EXERCISES_PER_WORKOUT} exercícios.`)
      continue
    }

    let musculo = asText(raw.musculo) || 'Treino'
    if (musculo.length > 80) {
      musculo = musculo.slice(0, 80)
      warnings.push(`${raw.where}: nome do treino muito longo, foi cortado em 80 caracteres.`)
    }

    const exercicios = raw.exercicios
      .map(exercise => validateExercise(exercise, errors, warnings))
      .filter((exercise): exercise is ParsedExercise => exercise !== null)

    treinos.push({ dia, musculo, exercicios })
  }

  return treinos.sort((a, b) => compareWeekDays(a.dia, b.dia))
}

function jsonToRawWorkouts(text: string, errors: string[]): RawWorkout[] {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch (err) {
    errors.push(`O JSON é inválido: ${err instanceof Error ? err.message : 'erro de sintaxe'}.`)
    return []
  }

  const list = Array.isArray(data) ? data : isObject(data) ? data.treinos : undefined
  if (!Array.isArray(list)) {
    errors.push('Não encontrei a lista de treinos. O JSON precisa ter um campo "treinos" com um item para cada dia.')
    return []
  }

  return list.flatMap((item, index): RawWorkout[] => {
    const position = `Treino ${index + 1}`
    if (!isObject(item)) {
      errors.push(`${position}: formato inválido, esperava um objeto com "dia", "musculo" e "exercicios".`)
      return []
    }

    const where = typeof item.dia === 'string' && item.dia.trim() ? `${position} (${item.dia.trim()})` : position
    const exercises = item.exercicios ?? []
    if (!Array.isArray(exercises)) {
      errors.push(`${where}: "exercicios" precisa ser uma lista.`)
      return []
    }

    return [{
      dia: item.dia,
      musculo: item.musculo ?? item.treino,
      where,
      exercicios: exercises.map((exercise, exerciseIndex) => ({
        data: isObject(exercise) ? exercise : {},
        where: `${where}, exercício ${exerciseIndex + 1}`,
      })),
    }]
  })
}

export function parseWorkoutImport(text: string): ImportParseResult {
  const trimmed = text.trim()
  if (!trimmed) return { ok: false, errors: ['Nenhum conteúdo para importar.'] }
  if (trimmed.length > MAX_IMPORT_CHARS) return { ok: false, errors: ['O conteúdo é grande demais (máximo de 1 MB).'] }

  const errors: string[] = []
  const warnings: string[] = []
  // trim() também remove o BOM do início
  const format: TransferFormat = /^[[{]/.test(trimmed) ? 'json' : 'csv'

  let raws: RawWorkout[]
  if (format === 'json') {
    raws = jsonToRawWorkouts(trimmed, errors)
  } else {
    const result = rowsToRawWorkouts(parseDelimited(trimmed))
    errors.push(...result.errors)
    warnings.push(...result.warnings)
    raws = result.workouts
  }

  const treinos = validateWorkouts(raws, errors, warnings)

  if (errors.length > 0) return { ok: false, errors }
  if (treinos.length === 0) return { ok: false, errors: ['Nenhum treino encontrado.'] }
  return { ok: true, format, treinos, warnings }
}

/** Lê o arquivo escolhido no seletor de documentos */
export async function readImportFile(uri: string, size?: number): Promise<string> {
  if (size !== undefined && size > MAX_IMPORT_CHARS) throw new Error('O arquivo é grande demais (máximo de 1 MB).')
  return new File(uri).text()
}

// ─── Export ──────────────────────────────────────────────────────────────────

export async function fetchWorkoutsForExport(userId: string): Promise<ParsedWorkout[]> {
  const workouts = (await getUserWorkouts(userId)).sort((a, b) => compareWeekDays(a.dia, b.dia))

  return Promise.all(workouts.map(async (workout): Promise<ParsedWorkout> => {
    const exercises = await getWorkoutExercises(workout)
    return {
      dia: workout.dia as WeekDay,
      musculo: workout.musculo || 'Treino',
      exercicios: exercises.map((exercise): ParsedExercise => {
        const usesProgressiveWeight = exercise.usesProgressiveWeight === true && (exercise.progressiveSets?.length ?? 0) > 0
        const parsed: ParsedExercise = {
          titulo: exercise.titulo,
          series: exercise.series,
          repeticoes: exercise.repeticoes,
          peso: exercise.peso,
          tempoIntervalo: exercise.tempoIntervalo,
          usesProgressiveWeight,
        }
        if (usesProgressiveWeight) parsed.progressiveSets = exercise.progressiveSets
        if (exercise.nota) parsed.nota = exercise.nota
        return parsed
      }),
    }
  }))
}

/** Grava o conteúdo num arquivo temporário e abre a folha de compartilhamento do sistema */
export async function shareTextFile(content: string, filename: string, mimeType: string) {
  const file = new File(Paths.cache, filename)
  if (file.exists) file.delete()
  file.create()
  file.write(content)
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: filename })
}

/** Exporta os treinos no formato escolhido. Retorna quantos foram exportados (0 = nenhum) */
export async function exportUserWorkouts(userId: string, format: TransferFormat): Promise<number> {
  const treinos = await fetchWorkoutsForExport(userId)
  if (treinos.length === 0) return 0

  const stamp = getLocalDateKey()
  if (format === 'json') {
    const file: WorkoutExportFile = { app: 'tractus', tipo: 'treinos', versao: 1, exportadoEm: new Date().toISOString(), treinos }
    await shareTextFile(JSON.stringify(file, null, 2), `tractus-treinos-${stamp}.json`, 'application/json')
  } else {
    await shareTextFile(workoutsToCsv(treinos), `tractus-treinos-${stamp}.csv`, 'text/csv')
  }
  return treinos.length
}

export const shareCsvTemplate = () => shareTextFile(CSV_TEMPLATE, 'modelo-treinos-tractus.csv', 'text/csv')

// ─── Import ──────────────────────────────────────────────────────────────────

export type ImportResult = {
  imported: WeekDay[]
  failed: { dia: WeekDay; message: string }[]
}

// Cada treino importado substitui o que existir no mesmo dia. O novo é criado antes de apagar o antigo,
// então uma falha no meio nunca deixa o usuário sem o treino anterior.
export async function importWorkouts(userId: string, treinos: ParsedWorkout[]): Promise<ImportResult> {
  const result: ImportResult = { imported: [], failed: [] }

  for (const treino of treinos) {
    const workoutRef = doc(collection(db, 'treinos'))
    let created = false

    try {
      const exerciseRefs = treino.exercicios.map(() => doc(collection(db, 'treinos', workoutRef.id, 'exercicios')))

      await setDoc(workoutRef, {
        usuarioID: userId,
        createdByUserId: userId,
        dia: treino.dia,
        musculo: treino.musculo,
        exerciseOrder: exerciseRefs.map(ref => ref.id),
      })
      created = true

      // Os exercícios só podem ser criados depois do treino existir: a regra do Firestore faz get() no treino pai
      if (exerciseRefs.length > 0) {
        const batch = writeBatch(db)
        treino.exercicios.forEach((exercicio, index) => {
          const data: Record<string, unknown> = {
            titulo: exercicio.titulo,
            series: exercicio.series,
            repeticoes: exercicio.repeticoes,
            peso: exercicio.peso,
            tempoIntervalo: exercicio.tempoIntervalo,
            usesProgressiveWeight: exercicio.usesProgressiveWeight,
            isFeito: false,
            isSkipped: false,
            setsDone: 0,
            restEndsAt: null,
          }
          if (exercicio.usesProgressiveWeight && exercicio.progressiveSets) data.progressiveSets = exercicio.progressiveSets
          if (exercicio.nota) data.nota = exercicio.nota
          batch.set(exerciseRefs[index], data)
        })
        await batch.commit()
      }
    } catch (error) {
      if (__DEV__) console.warn(`Erro ao importar treino de ${treino.dia}:`, error)
      if (created) await deleteWorkoutWithExercises(workoutRef.id).catch(() => {})
      result.failed.push({ dia: treino.dia, message: 'Não foi possível salvar o treino.' })
      continue
    }

    try {
      const sameDaySnap = await getDocs(query(collection(db, 'treinos'), where('usuarioID', '==', userId), where('dia', '==', treino.dia)))
      const previous = sameDaySnap.docs.filter(workoutDoc => workoutDoc.id !== workoutRef.id && !workoutDoc.data().isTemplate)
      for (const workoutDoc of previous) {
        await deleteWorkoutWithExercises(workoutDoc.id)
      }
      result.imported.push(treino.dia)
    } catch (error) {
      if (__DEV__) console.warn(`Erro ao remover treino antigo de ${treino.dia}:`, error)
      result.failed.push({ dia: treino.dia, message: 'O treino novo foi salvo, mas o antigo não pôde ser removido. Exclua-o manualmente.' })
    }
  }

  if (result.imported.length > 0) await updateScheduledDays(userId)

  return result
}
