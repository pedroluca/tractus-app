import { collection, doc, getDoc, getDocs, query, runTransaction, updateDoc, where, writeBatch } from '@react-native-firebase/firestore'
import { getLocalDateKey, parseDateKey } from '@/lib/dates'
import { emit } from '@/lib/events'
import { db } from '@/lib/firebase'
import { getStreakMilestoneValue, STREAK_MILESTONE_WEEKS } from './badges'
import { WEEK_DAYS } from './week-days'

// Mesma regra do app web: streak semanal (1 treino por semana, domingo a sábado),
// com freezes que protegem semanas sem treino.

const FREEZE_CAP_FREE = 1
const FREEZE_CAP_PREMIUM = 2
const FREEZE_MONTHLY_FREE = 1
const FREEZE_MONTHLY_PREMIUM = 2

const STREAK_VERSION = 2
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

type StreakUserData = {
  currentStreak?: number
  longestStreak?: number
  lastStreakWeek?: string
  lastWorkoutDate?: string
  totalWorkouts?: number
  streakVersion?: number
  isPremium?: boolean
  freezeCount?: number
  freezeLastGrantedMonth?: string
  streakMilestoneRewardedUpTo?: number
}

export type FreezeWarning = {
  remainingFreezes: number
  streakBroken: boolean
  message: string
}

export type StreakUpdateResult = {
  currentStreak: number
  totalWorkouts: number
  streakIncremented: boolean
}

type StreakSyncResult = StreakUpdateResult & {
  freezeWarning: FreezeWarning | null
}

const getMonthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

function getWeekStart(date = new Date()): Date {
  const weekStart = new Date(date)
  weekStart.setHours(0, 0, 0, 0)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  return weekStart
}

/** Chave da semana (domingo que a inicia) no formato YYYY-MM-DD, horário local */
export function getWeekKey(date = new Date()): string {
  return getLocalDateKey(getWeekStart(date))
}

function weeksBetween(fromWeekKey: string, toWeekKey: string): number {
  const from = parseDateKey(fromWeekKey)
  const to = parseDateKey(toWeekKey)
  if (!from || !to) return 0
  // Math.round absorve a hora a mais/a menos do horário de verão
  return Math.round((to.getTime() - from.getTime()) / WEEK_MS)
}

function getPreviousWeekKey(weekKey: string): string {
  const weekStart = parseDateKey(weekKey) ?? getWeekStart()
  weekStart.setDate(weekStart.getDate() - 7)
  return getLocalDateKey(weekStart)
}

// Semanas inteiras sem treino entre a última semana contabilizada e a atual (a atual nunca conta como falta)
function countMissedWeeks(lastStreakWeek: string, currentWeekKey: string): number {
  if (!lastStreakWeek) return 0
  return Math.max(0, weeksBetween(lastStreakWeek, currentWeekKey) - 1)
}

/** Converte o campo `data` de um log (ISO string ou Firestore Timestamp) em Date */
export function parseLogDate(raw: unknown): Date | null {
  if (typeof raw === 'string') {
    const date = new Date(raw)
    return Number.isNaN(date.getTime()) ? null : date
  }
  if (raw && typeof raw === 'object' && 'seconds' in raw && typeof raw.seconds === 'number') {
    return new Date(raw.seconds * 1000)
  }
  return null
}

export const getFreezeCap = (isPremium?: boolean) => (isPremium ? FREEZE_CAP_PREMIUM : FREEZE_CAP_FREE)
const getMonthlyFreezeAmount = (isPremium?: boolean) => (isPremium ? FREEZE_MONTHLY_PREMIUM : FREEZE_MONTHLY_FREE)

function computeWeeklyHistory(workoutWeeks: Set<string>) {
  let currentStreak = 0
  let longestStreak = 0
  let lastStreakWeek = ''

  for (const weekKey of Array.from(workoutWeeks).sort()) {
    currentStreak = lastStreakWeek && weeksBetween(lastStreakWeek, weekKey) === 1 ? currentStreak + 1 : 1
    longestStreak = Math.max(longestStreak, currentStreak)
    lastStreakWeek = weekKey
  }

  return { currentStreak, longestStreak, lastStreakWeek }
}

// Migra usuários do modelo diário para o semanal recalculando a partir dos logs
async function ensureStreakMigrated(userId: string): Promise<void> {
  const userRef = doc(db, 'usuarios', userId)
  const userSnap = await getDoc(userRef)
  if (!userSnap.exists() || (userSnap.data() as StreakUserData).streakVersion === STREAK_VERSION) return

  const logsSnapshot = await getDocs(query(collection(db, 'logs'), where('usuarioID', '==', userId)))
  const workoutDays = new Set<string>()
  const workoutWeeks = new Set<string>()

  logsSnapshot.docs.forEach(logDoc => {
    const date = parseLogDate(logDoc.data().data)
    if (!date) return
    workoutDays.add(date.toDateString())
    workoutWeeks.add(getWeekKey(date))
  })

  const history = computeWeeklyHistory(workoutWeeks)

  await runTransaction(db, async transaction => {
    const freshSnap = await transaction.get(userRef)
    if (!freshSnap.exists()) return
    const data = freshSnap.data() as StreakUserData
    if (data.streakVersion === STREAK_VERSION) return

    transaction.update(userRef, {
      currentStreak: history.currentStreak,
      longestStreak: history.longestStreak,
      lastStreakWeek: history.lastStreakWeek,
      totalWorkouts: workoutDays.size,
      freezeCount: Math.min(data.freezeCount || 0, getFreezeCap(data.isPremium)),
      streakMilestoneRewardedUpTo: getStreakMilestoneValue(history.longestStreak),
      streakVersion: STREAK_VERSION,
    })
  })
}

function buildFreezeWarningMessage(remainingFreezes: number, streakBroken: boolean): string {
  if (streakBroken) return 'Sua streak foi zerada: você ficou uma semana sem treinar e não tinha freezes suficientes.'
  if (remainingFreezes === 0) return 'Você usou o último freeze. Se passar mais uma semana sem treinar, sua streak será zerada.'
  return 'Freeze consumido com sucesso.'
}

async function syncStreakState(userId: string, mode: 'maintenance' | 'workout'): Promise<StreakSyncResult | null> {
  await ensureStreakMigrated(userId)

  const userRef = doc(db, 'usuarios', userId)
  const today = new Date()
  const todayMonth = getMonthKey(today)
  const todayKey = getLocalDateKey(today)
  const currentWeek = getWeekKey(today)

  return runTransaction(db, async transaction => {
    const userSnap = await transaction.get(userRef)
    if (!userSnap.exists()) return null

    const raw = userSnap.data() as StreakUserData
    const isPremium = !!raw.isPremium
    const freezeCap = getFreezeCap(isPremium)

    let currentStreak = raw.currentStreak || 0
    let longestStreak = raw.longestStreak || 0
    let freezeCount = raw.freezeCount || 0
    let freezeLastGrantedMonth = raw.freezeLastGrantedMonth || ''
    let lastStreakWeek = raw.lastStreakWeek || ''
    let lastWorkoutDate = raw.lastWorkoutDate || ''
    let totalWorkouts = raw.totalWorkouts || 0
    let streakMilestoneRewardedUpTo = typeof raw.streakMilestoneRewardedUpTo === 'number'
      ? raw.streakMilestoneRewardedUpTo
      : getStreakMilestoneValue(longestStreak)

    let changed = typeof raw.streakMilestoneRewardedUpTo !== 'number'
    let usedFreezeThisRun = false
    let streakBrokenThisRun = false
    let streakIncremented = false

    if (freezeLastGrantedMonth !== todayMonth) {
      freezeCount = Math.min(freezeCap, freezeCount + getMonthlyFreezeAmount(isPremium))
      freezeLastGrantedMonth = todayMonth
      changed = true
    }

    if (freezeCount > freezeCap) {
      freezeCount = freezeCap
      changed = true
    }

    const missedWeeks = countMissedWeeks(lastStreakWeek, currentWeek)
    if (currentStreak > 0 && missedWeeks > 0) {
      if (freezeCount >= missedWeeks) {
        freezeCount -= missedWeeks
        lastStreakWeek = getPreviousWeekKey(currentWeek)
        usedFreezeThisRun = true
      } else {
        freezeCount = 0
        currentStreak = 0
        streakBrokenThisRun = true
      }
      changed = true
    }

    if (mode === 'workout' && lastWorkoutDate !== todayKey) {
      totalWorkouts++
      lastWorkoutDate = todayKey
      changed = true

      // Só o primeiro treino da semana avança a streak
      if (lastStreakWeek !== currentWeek) {
        currentStreak = currentStreak > 0 ? currentStreak + 1 : 1
        longestStreak = Math.max(longestStreak, currentStreak)
        lastStreakWeek = currentWeek
        streakIncremented = true

        const achievedMilestone = getStreakMilestoneValue(longestStreak)
        if (achievedMilestone > streakMilestoneRewardedUpTo) {
          const milestoneIndex = achievedMilestone / STREAK_MILESTONE_WEEKS
          // O primeiro marco dá freeze para todos; os seguintes só para Premium
          if (milestoneIndex === 1 || isPremium) {
            freezeCount = Math.min(freezeCap, freezeCount + 1)
          }
          streakMilestoneRewardedUpTo = achievedMilestone
        }
      }
    }

    let freezeWarning: FreezeWarning | null = null
    if (streakBrokenThisRun) {
      freezeWarning = { remainingFreezes: freezeCount, streakBroken: true, message: buildFreezeWarningMessage(freezeCount, true) }
    } else if (usedFreezeThisRun && freezeCount === 0) {
      freezeWarning = { remainingFreezes: 0, streakBroken: false, message: buildFreezeWarningMessage(0, false) }
    }

    if (changed) {
      transaction.update(userRef, {
        currentStreak,
        longestStreak,
        lastStreakWeek,
        lastWorkoutDate,
        totalWorkouts,
        freezeCount,
        freezeLastGrantedMonth,
        streakMilestoneRewardedUpTo,
      })
    }

    return { currentStreak, totalWorkouts, streakIncremented, freezeWarning }
  })
}

/** Rotina de abertura do app: concede freezes do mês e consome/zera a streak por semanas perdidas */
export async function checkAndResetStreakIfMissed(userId: string): Promise<void> {
  try {
    const result = await syncStreakState(userId, 'maintenance')
    if (result?.freezeWarning) emit('freezeWarning', result.freezeWarning)
  } catch (error) {
    if (__DEV__) console.warn('Erro ao verificar streak:', error)
  }
}

/** Contabiliza um treino concluído hoje */
export async function updateStreak(userId: string): Promise<StreakUpdateResult | null> {
  try {
    const result = await syncStreakState(userId, 'workout')
    if (!result) return null
    if (result.freezeWarning) emit('freezeWarning', result.freezeWarning)
    return { currentStreak: result.currentStreak, totalWorkouts: result.totalWorkouts, streakIncremented: result.streakIncremented }
  } catch (error) {
    if (__DEV__) console.warn('Erro ao atualizar streak:', error)
    return null
  }
}

/** Zera o progresso dos treinos de outros dias (o "check" de cada exercício vale só para o dia) */
export async function resetPreviousDaysExercises(userId: string): Promise<void> {
  try {
    const todayName = WEEK_DAYS[new Date().getDay()]
    const workoutsSnap = await getDocs(query(collection(db, 'treinos'), where('usuarioID', '==', userId)))

    for (const workoutDoc of workoutsSnap.docs) {
      if (workoutDoc.data().dia === todayName) continue

      const exercisesSnap = await getDocs(collection(db, 'treinos', workoutDoc.id, 'exercicios'))
      const stale = exercisesSnap.docs.filter(exerciseDoc => {
        const data = exerciseDoc.data()
        return data.isFeito === true || data.isSkipped === true || (data.setsDone ?? 0) > 0 || data.restEndsAt != null
      })
      if (stale.length === 0) continue

      const batch = writeBatch(db)
      stale.forEach(exerciseDoc => batch.update(exerciseDoc.ref, { isFeito: false, isSkipped: false, setsDone: 0, restEndsAt: null }))
      await batch.commit()
    }
  } catch (error) {
    if (__DEV__) console.warn('Erro ao resetar exercícios de outros dias:', error)
  }
}

/** Atualiza os dias da semana que têm treino com exercícios (usado no calendário de streak) */
export async function updateScheduledDays(userId: string): Promise<void> {
  try {
    const workoutsSnap = await getDocs(query(collection(db, 'treinos'), where('usuarioID', '==', userId)))
    const days = new Set<number>()

    await Promise.all(workoutsSnap.docs.map(async workoutDoc => {
      const exercisesSnap = await getDocs(collection(db, 'treinos', workoutDoc.id, 'exercicios'))
      const dayIndex = WEEK_DAYS.indexOf(workoutDoc.data().dia)
      if (!exercisesSnap.empty && dayIndex !== -1) days.add(dayIndex)
    }))

    await updateDoc(doc(db, 'usuarios', userId), { scheduledDays: Array.from(days).sort() })
  } catch (error) {
    if (__DEV__) console.warn('Erro ao atualizar dias de treino:', error)
  }
}
