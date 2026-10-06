import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from '@react-native-firebase/firestore'
import { db } from '@/lib/firebase'
import { settle } from '@/lib/writes'
import type { Exercicio, ProgressiveSet, Treino } from './types'

// ─── Mapeamento ──────────────────────────────────────────────────────────────

export function mapWorkout(snapshot: QueryDocumentSnapshot<DocumentData>): Treino {
  return { id: snapshot.id, ...snapshot.data() } as Treino
}

export function mapExercise(snapshot: QueryDocumentSnapshot<DocumentData>): Exercicio {
  const data = snapshot.data()
  return {
    id: snapshot.id,
    titulo: data.titulo ?? '',
    series: Number(data.series) || 0,
    repeticoes: Number(data.repeticoes) || 0,
    peso: Number(data.peso) || 0,
    tempoIntervalo: Number(data.tempoIntervalo) || 0,
    isFeito: data.isFeito === true,
    isSkipped: data.isSkipped === true,
    lastDoneDate: data.lastDoneDate,
    nota: data.nota,
    usesProgressiveWeight: data.usesProgressiveWeight === true,
    progressiveSets: Array.isArray(data.progressiveSets) ? data.progressiveSets : undefined,
    setsDone: typeof data.setsDone === 'number' ? data.setsDone : 0,
    restEndsAt: typeof data.restEndsAt === 'number' ? data.restEndsAt : null,
  }
}

/** Ordena pela ordem customizada do treino; o que não estiver nela vai para o fim em ordem alfabética */
export function sortExercises(exercises: Exercicio[], order?: string[]): Exercicio[] {
  const position = new Map((order ?? []).map((id, index) => [id, index]))
  return [...exercises].sort((a, b) => {
    const indexA = position.get(a.id)
    const indexB = position.get(b.id)
    if (indexA !== undefined && indexB !== undefined) return indexA - indexB
    if (indexA !== undefined) return -1
    if (indexB !== undefined) return 1
    return a.titulo.localeCompare(b.titulo)
  })
}

const workoutsQuery = (userId: string) => query(collection(db, 'treinos'), where('usuarioID', '==', userId))
const exercisesRef = (workoutId: string) => collection(db, 'treinos', workoutId, 'exercicios')
const exerciseRef = (workoutId: string, exerciseId: string) => doc(db, 'treinos', workoutId, 'exercicios', exerciseId)

// ─── Leitura ─────────────────────────────────────────────────────────────────

export async function getUserWorkouts(userId: string): Promise<Treino[]> {
  const snapshot = await getDocs(workoutsQuery(userId))
  return snapshot.docs.map(mapWorkout).filter(workout => !workout.isTemplate)
}

export async function getWorkoutExercises(workout: Pick<Treino, 'id' | 'exerciseOrder'>): Promise<Exercicio[]> {
  const snapshot = await getDocs(exercisesRef(workout.id))
  return sortExercises(snapshot.docs.map(mapExercise), workout.exerciseOrder)
}

/** Treinos do usuário em tempo real (o cache offline responde na hora, mesmo sem internet) */
export function subscribeUserWorkouts(userId: string, onChange: (workouts: Treino[]) => void, onError?: (error: Error) => void) {
  return onSnapshot(
    workoutsQuery(userId),
    snapshot => onChange(snapshot.docs.map(mapWorkout).filter(workout => !workout.isTemplate)),
    onError,
  )
}

export function subscribeWorkoutExercises(workoutId: string, onChange: (exercises: Exercicio[]) => void, onError?: (error: Error) => void) {
  return onSnapshot(
    exercisesRef(workoutId),
    snapshot => onChange(snapshot.docs.map(mapExercise)),
    onError,
  )
}

// ─── Treinos ─────────────────────────────────────────────────────────────────

async function hasWorkoutOnDay(userId: string, day: string) {
  const snapshot = await getDocs(query(collection(db, 'treinos'), where('usuarioID', '==', userId), where('dia', '==', day)))
  return snapshot.docs.some(workoutDoc => !workoutDoc.data().isTemplate)
}

export class WorkoutDayTakenError extends Error {
  constructor() {
    super('Já existe um treino cadastrado para este dia.')
  }
}

export async function createWorkout(params: { userId: string; createdBy: string; day: string; name: string }) {
  if (await hasWorkoutOnDay(params.userId, params.day)) throw new WorkoutDayTakenError()

  const ref = doc(collection(db, 'treinos'))
  await settle(setDoc(ref, {
    usuarioID: params.userId,
    createdByUserId: params.createdBy,
    dia: params.day,
    musculo: params.name.trim(),
    exerciseOrder: [],
  }))
  return ref.id
}

export class InvalidShareCodeError extends Error {}

/** Código de compartilhamento = "{workoutId}-{donoId}" */
export const buildShareCode = (workoutId: string, ownerId: string) => `${workoutId}-${ownerId}`

/** Copia um treino compartilhado (ou modelo) para o dia escolhido */
export async function cloneSharedWorkout(params: { code: string; userId: string; createdBy: string; day: string }) {
  const [sourceId, ownerId] = params.code.trim().split('-')
  if (!sourceId || !ownerId) throw new InvalidShareCodeError('Código de compartilhamento inválido.')

  if (await hasWorkoutOnDay(params.userId, params.day)) throw new WorkoutDayTakenError()

  const sourceSnap = await getDoc(doc(db, 'treinos', sourceId))
  if (!sourceSnap.exists() || sourceSnap.data()?.usuarioID !== ownerId) {
    throw new InvalidShareCodeError('Treino não encontrado ou sem permissão.')
  }

  const source = sourceSnap.data() as Treino
  const sourceExercises = await getWorkoutExercises({ id: sourceId, exerciseOrder: source.exerciseOrder })

  const newWorkoutRef = doc(collection(db, 'treinos'))
  const exerciseRefs = sourceExercises.map(() => doc(exercisesRef(newWorkoutRef.id)))

  const workoutWrite = setDoc(newWorkoutRef, {
    usuarioID: params.userId,
    createdByUserId: params.createdBy,
    dia: params.day,
    musculo: source.musculo,
    exerciseOrder: exerciseRefs.map(ref => ref.id),
  })

  // As regras validam o treino pai com get(), então os exercícios vão num segundo lote.
  // A fila de escrita do Firestore é ordenada: o lote só é avaliado depois do treino existir.
  let exercisesWrite: Promise<void> = Promise.resolve()
  if (sourceExercises.length > 0) {
    const batch = writeBatch(db)
    sourceExercises.forEach((exercise, index) => {
      batch.set(exerciseRefs[index], buildExerciseData({
        titulo: exercise.titulo,
        series: exercise.series,
        repeticoes: exercise.repeticoes,
        peso: exercise.peso,
        tempoIntervalo: exercise.tempoIntervalo,
        usesProgressiveWeight: !!exercise.usesProgressiveWeight,
        progressiveSets: exercise.progressiveSets,
        nota: exercise.nota,
      }))
    })
    exercisesWrite = batch.commit()
  }

  await settle(Promise.all([workoutWrite, exercisesWrite]), 2500)
  return { id: newWorkoutRef.id, name: source.musculo }
}

export async function updateWorkout(workoutId: string, data: Partial<Pick<Treino, 'dia' | 'musculo' | 'exerciseOrder'>>) {
  await updateDoc(doc(db, 'treinos', workoutId), data)
}

export async function deleteWorkoutWithExercises(workoutId: string) {
  const exercisesSnap = await getDocs(exercisesRef(workoutId))
  const batch = writeBatch(db)
  exercisesSnap.docs.forEach(exerciseDoc => batch.delete(exerciseDoc.ref))
  batch.delete(doc(db, 'treinos', workoutId))
  await batch.commit()
}

/** Zera o progresso de hoje de todos os exercícios do treino */
export async function resetWorkoutExercises(workoutId: string) {
  const exercisesSnap = await getDocs(exercisesRef(workoutId))
  const batch = writeBatch(db)
  exercisesSnap.docs.forEach(exerciseDoc => {
    batch.update(exerciseDoc.ref, { isFeito: false, isSkipped: false, setsDone: 0, restEndsAt: null })
  })
  await batch.commit()
}

// ─── Exercícios ──────────────────────────────────────────────────────────────

export type ExerciseInput = {
  titulo: string
  series: number
  repeticoes: number
  peso: number
  tempoIntervalo: number
  usesProgressiveWeight: boolean
  progressiveSets?: ProgressiveSet[]
  nota?: string
}

function buildExerciseData(input: ExerciseInput): DocumentData {
  const data: DocumentData = {
    titulo: input.titulo.trim(),
    series: input.series,
    repeticoes: input.repeticoes,
    peso: input.peso,
    tempoIntervalo: input.tempoIntervalo,
    usesProgressiveWeight: input.usesProgressiveWeight,
    isFeito: false,
    isSkipped: false,
    setsDone: 0,
    restEndsAt: null,
  }
  if (input.usesProgressiveWeight && input.progressiveSets?.length) data.progressiveSets = input.progressiveSets
  if (input.nota) data.nota = input.nota
  return data
}

// As escritas abaixo usam lote (batch) e não dependem de leituras: assim ficam na fila offline
// como uma operação só e a UI não precisa esperar o servidor confirmar.

export function addExercise(workoutId: string, input: ExerciseInput) {
  const ref = doc(exercisesRef(workoutId))
  const batch = writeBatch(db)
  batch.set(ref, buildExerciseData(input))
  batch.update(doc(db, 'treinos', workoutId), { exerciseOrder: arrayUnion(ref.id) })
  return batch.commit()
}

export async function updateExercise(workoutId: string, exerciseId: string, input: ExerciseInput) {
  await updateDoc(exerciseRef(workoutId, exerciseId), {
    titulo: input.titulo.trim(),
    series: input.series,
    repeticoes: input.repeticoes,
    peso: input.peso,
    tempoIntervalo: input.tempoIntervalo,
    usesProgressiveWeight: input.usesProgressiveWeight,
    progressiveSets: input.usesProgressiveWeight && input.progressiveSets?.length ? input.progressiveSets : deleteField(),
  })
}

export function deleteExercise(workoutId: string, exerciseId: string) {
  const batch = writeBatch(db)
  batch.delete(exerciseRef(workoutId, exerciseId))
  batch.update(doc(db, 'treinos', workoutId), { exerciseOrder: arrayRemove(exerciseId) })
  return batch.commit()
}

export async function saveExerciseNote(workoutId: string, exerciseId: string, note: string) {
  await updateDoc(exerciseRef(workoutId, exerciseId), { nota: note.trim() ? note.trim() : deleteField() })
}

/** Salva a série atual e o fim do descanso; é o que permite retomar o timer depois de fechar o app */
export function saveExerciseProgress(workoutId: string, exerciseId: string, setsDone: number, restEndsAt: number | null) {
  return updateDoc(exerciseRef(workoutId, exerciseId), { setsDone, restEndsAt })
}

/** Marca o exercício como feito (registrando no histórico, no mesmo lote) ou como pulado */
export function finishExercise(params: { workoutId: string; exercise: Exercicio; userId: string; skipped: boolean }) {
  const { workoutId, exercise, userId, skipped } = params
  const now = new Date().toISOString()
  const batch = writeBatch(db)

  batch.update(exerciseRef(workoutId, exercise.id), {
    isFeito: true,
    isSkipped: skipped,
    lastDoneDate: now,
    restEndsAt: null,
    ...(skipped ? {} : { setsDone: exercise.series }),
  })

  if (!skipped) {
    batch.set(doc(collection(db, 'logs')), {
      usuarioID: userId,
      titulo: exercise.titulo,
      series: exercise.series,
      repeticoes: exercise.repeticoes,
      peso: exercise.peso,
      usesProgressiveWeight: !!exercise.usesProgressiveWeight,
      progressiveSets: exercise.usesProgressiveWeight ? exercise.progressiveSets ?? [] : [],
      data: now,
    })
  }

  return batch.commit()
}

/** Volta o exercício para "não concluído" mantendo (ou zerando) as séries feitas */
export function reopenExercise(workoutId: string, exerciseId: string, setsDone: number) {
  return updateDoc(exerciseRef(workoutId, exerciseId), { isFeito: false, isSkipped: false, setsDone, restEndsAt: null })
}
