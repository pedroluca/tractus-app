import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake'
import { router, useIsFocused } from 'expo-router'
import { CalendarPlus, ListPlus, Plus, Settings2 } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { IconButton } from '@/components/ui/icon-button'
import { Chip, ChipRow, EmptyState, ProgressBar, Skeleton } from '@/components/ui/misc'
import { Text } from '@/components/ui/text'
import { updateStreak, type StreakUpdateResult } from '@/data/streak'
import type { Exercicio, UserProfile } from '@/data/types'
import { trackWorkoutCompleted } from '@/lib/analytics'
import { getLocalDateKey } from '@/lib/dates'
import { kv, storageKeys } from '@/lib/storage'
import { playBeep } from './beep'
import { DayStrip } from './day-strip'
import { ExercisePager } from './exercise-pager'
import { useTrainingData } from './use-training-data'
import { WorkoutCompleteDialog } from './workout-complete-dialog'

const KEEP_AWAKE_TAG = 'training'

type TrainingViewProps = {
  /** Usuário logado */
  viewer: UserProfile
  /** Dono dos treinos (o próprio usuário ou um aluno) */
  ownerId: string
}

const isDoneToday = (exercise: Exercicio) =>
  (exercise.isFeito || exercise.isSkipped) && !!exercise.lastDoneDate && getLocalDateKey(new Date(exercise.lastDoneDate)) === getLocalDateKey()

type Completion = { workoutName: string; result: StreakUpdateResult | null }

export function TrainingView({ viewer, ownerId }: TrainingViewProps) {
  const managing = ownerId !== viewer.id
  const [dayIndex, setDayIndex] = useState(() => new Date().getDay())
  const { loading, day, dayWorkouts, workout, exercises, selectWorkout, creatorLabel, daysWithWorkout, dayTakenByOther } = useTrainingData({
    userId: ownerId,
    managerId: managing ? viewer.id : undefined,
    dayIndex,
  })

  const isFocused = useIsFocused()
  const audioEnabled = viewer.audioEnabled === true
  const beep = () => {
    if (audioEnabled) playBeep()
  }

  // ─── Tela sempre ligada enquanto treina ───────────────────────────────────
  const shouldKeepAwake = isFocused && !managing && !!exercises?.length
  useEffect(() => {
    if (!shouldKeepAwake) return
    activateKeepAwakeAsync(KEEP_AWAKE_TAG).catch(() => {})
    return () => {
      deactivateKeepAwake(KEEP_AWAKE_TAG).catch(() => {})
    }
  }, [shouldKeepAwake])

  // ─── Treino concluído: atualiza streak e comemora uma vez por dia ─────────
  const [completion, setCompletion] = useState<Completion | null>(null)
  const allDone = !managing && !!exercises?.length && exercises.every(isDoneToday)
  const workoutId = workout?.id
  const workoutName = workout?.musculo ?? ''
  const workoutDay = workout?.dia ?? ''
  const exerciseCount = exercises?.length ?? 0

  useEffect(() => {
    if (!allDone || !workoutId) return
    const key = storageKeys.workoutCelebrated(workoutId, getLocalDateKey())
    if (kv.getBoolean(key)) return
    kv.set(key, true)

    trackWorkoutCompleted(workoutDay, exerciseCount)
    let active = true
    // O diálogo abre logo e a streak chega em seguida (a escrita da streak é uma transação no servidor)
    const opening = setTimeout(() => active && setCompletion({ workoutName, result: null }), 0)
    updateStreak(viewer.id).then(result => {
      if (!active) return
      setCompletion({
        workoutName,
        result: result ?? { currentStreak: viewer.currentStreak ?? 0, totalWorkouts: viewer.totalWorkouts ?? 0, streakIncremented: false },
      })
    })
    return () => {
      active = false
      clearTimeout(opening)
    }
    // Só reage à conclusão do treino; os outros valores são lidos no momento
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone, workoutId])

  const doneCount = exercises?.filter(exercise => exercise.isFeito || exercise.isSkipped).length ?? 0

  const openNewWorkout = () => router.push({ pathname: '/workout/new', params: { day, ownerId } })
  const openNewExercise = () => workout && router.push({ pathname: '/workout/[workoutId]/exercise/new', params: { workoutId: workout.id } })

  return (
    <View className="flex-1 gap-4">
      <View className="px-4">
        <DayStrip selected={dayIndex} onSelect={setDayIndex} daysWithWorkout={daysWithWorkout} />
      </View>

      {loading ? (
        <View className="flex-1 px-4 gap-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="flex-1 rounded-3xl mb-4" />
        </View>
      ) : !workout ? (
        <View className="flex-1 justify-center px-4">
          {dayTakenByOther ? (
            <EmptyState
              icon={CalendarPlus}
              title={`Esse aluno já tem treino na ${day.toLowerCase()}`}
              description="Ele foi criado por outra pessoa. Para evitar conflito, não é possível criar outro treino nesse dia."
            />
          ) : (
            <EmptyState
              icon={CalendarPlus}
              title={`Nenhum treino para ${day.toLowerCase()}`}
              description="Crie um treino do zero, escolha um modelo pronto ou use um código de compartilhamento."
              actionLabel="Adicionar treino"
              onAction={openNewWorkout}
            />
          )}
        </View>
      ) : (
        <View className="flex-1 gap-3">
          {dayWorkouts.length > 1 && (
            <View className="px-4">
              <ChipRow>
                {dayWorkouts.map(item => (
                  <Chip key={item.id} label={item.musculo} selected={item.id === workout.id} onPress={() => selectWorkout(item.id)} />
                ))}
              </ChipRow>
            </View>
          )}

          <View className="px-4 flex-row items-start gap-2">
            <View className="flex-1 gap-0.5">
              <Text variant="title" numberOfLines={2}>{workout.musculo}</Text>
              <Text tone="muted" className="text-sm">
                {[creatorLabel(workout) && `Criado por ${creatorLabel(workout)}`, exercises && `${exercises.length} ${exercises.length === 1 ? 'exercício' : 'exercícios'}`]
                  .filter(Boolean)
                  .join(' · ')}
              </Text>
            </View>
            <IconButton icon={Plus} variant="surface" accessibilityLabel="Adicionar exercício" onPress={openNewExercise} />
            <IconButton
              icon={Settings2}
              variant="surface"
              accessibilityLabel="Editar treino"
              onPress={() => router.push({ pathname: '/workout/[workoutId]/edit', params: { workoutId: workout.id } })}
            />
          </View>

          {!managing && !!exercises?.length && (
            <View className="px-4 gap-1.5">
              <ProgressBar value={doneCount / exercises.length} />
              <Text variant="caption" tone="muted">{doneCount} de {exercises.length} concluídos hoje</Text>
            </View>
          )}

          {exercises === null ? (
            <View className="flex-1 px-4 pb-4">
              <Skeleton className="flex-1 rounded-3xl" />
            </View>
          ) : exercises.length === 0 ? (
            <View className="flex-1 justify-center px-4">
              <EmptyState
                icon={ListPlus}
                title="Treino sem exercícios"
                description="Adicione os exercícios com séries, repetições, carga e descanso."
                actionLabel="Adicionar exercício"
                onAction={openNewExercise}
              />
            </View>
          ) : (
            <ExercisePager
              key={workout.id}
              exercises={exercises}
              workoutId={workout.id}
              userId={viewer.id}
              readOnly={managing}
              playBeep={beep}
            />
          )}
        </View>
      )}

      {completion && (
        <WorkoutCompleteDialog
          visible
          workoutName={completion.workoutName}
          result={completion.result}
          onClose={() => setCompletion(null)}
        />
      )}
    </View>
  )
}
