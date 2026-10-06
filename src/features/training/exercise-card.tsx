import { router } from 'expo-router'
import { Check, CircleSlash, Ellipsis, NotebookPen, Pencil, RotateCcw, StickyNote, Timer, Undo2 } from 'lucide-react-native'
import { useEffect, useRef, useState } from 'react'
import { ScrollView, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { IconButton } from '@/components/ui/icon-button'
import { ProgressBar } from '@/components/ui/misc'
import { ActionSheet } from '@/components/ui/sheet'
import { Text } from '@/components/ui/text'
import type { Exercicio } from '@/data/types'
import { finishExercise, reopenExercise, saveExerciseNote, saveExerciseProgress } from '@/data/workouts'
import { trackExerciseCompleted } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { formatClock, formatRest, formatWeight } from '@/lib/dates'
import { haptics } from '@/lib/haptics'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'
import { NoteSheet } from './note-sheet'

type ExerciseCardProps = {
  exercise: Exercicio
  workoutId: string
  userId: string
  position: number
  total: number
  /** Treinador vendo o treino do aluno: só planejamento, sem executar */
  readOnly: boolean
  onFinished: () => void
  playBeep: () => void
}

export function ExerciseCard({ exercise, workoutId, userId, position, total, readOnly, onFinished, playBeep }: ExerciseCardProps) {
  const colors = useThemeColors()
  const toast = useToast()
  const [menuOpen, setMenuOpen] = useState(false)
  const [noteOpen, setNoteOpen] = useState(false)

  // Os botões ficam travados até o Firestore devolver o novo estado do exercício
  // (a escrita local aparece quase na hora; isso evita toque duplo contar duas séries)
  const stateKey = `${exercise.setsDone}|${exercise.restEndsAt}|${exercise.isFeito}|${exercise.isSkipped}`
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const busy = busyKey === stateKey
  const setBusy = (value: boolean) => setBusyKey(value ? stateKey : null)

  const finished = exercise.isFeito || exercise.isSkipped
  const resting = !finished && exercise.restEndsAt != null
  const setsDone = finished ? exercise.series : Math.min(exercise.setsDone, exercise.series)
  // A série conta como feita quando o descanso começa; ela só é gravada quando o descanso acaba
  const displayDone = finished ? exercise.series : Math.min(exercise.series, exercise.setsDone + (resting ? 1 : 0))
  const progressive = exercise.usesProgressiveWeight && exercise.progressiveSets?.length ? exercise.progressiveSets : null
  const nextSet = progressive?.[exercise.setsDone + 1]

  // ─── Timer de descanso ────────────────────────────────────────────────────
  // O fim do descanso fica salvo no exercício (restEndsAt); o tempo restante é sempre
  // recalculado a partir dele, então o timer sobrevive a sair do app ou desligar a tela.
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (!resting) return
    const tick = () => setNow(Date.now())
    const first = setTimeout(tick, 0)
    const interval = setInterval(tick, 250)
    return () => {
      clearTimeout(first)
      clearInterval(interval)
    }
  }, [resting, exercise.restEndsAt])

  const remainingMs = resting ? Math.max(0, (exercise.restEndsAt ?? 0) - now) : 0
  const restProgress = resting && exercise.tempoIntervalo > 0 ? 1 - remainingMs / (exercise.tempoIntervalo * 1000) : 0

  const fail = (message: string) => (error: unknown) => {
    if (__DEV__) console.warn(message, error)
    setBusy(false)
    toast.error(message)
  }

  const completeSet = (fromTimer: boolean) => {
    // Evita concluir a mesma série duas vezes (toque duplo, ou toque no mesmo instante em que o timer zera)
    if (busy) return
    if (fromTimer) playBeep()
    haptics.success()
    setBusy(true)
    const next = exercise.setsDone + 1
    if (next >= exercise.series) {
      finishExercise({ workoutId, exercise, userId, skipped: false }).catch(fail('Erro ao concluir o exercício.'))
      trackExerciseCompleted(exercise.titulo)
      onFinished()
    } else {
      saveExerciseProgress(workoutId, exercise.id, next, null).catch(fail('Erro ao salvar a série.'))
    }
  }

  const handledRestEnd = useRef<number | null>(null)
  useEffect(() => {
    if (!resting || readOnly || remainingMs > 0) return
    if (handledRestEnd.current === exercise.restEndsAt) return
    handledRestEnd.current = exercise.restEndsAt
    completeSet(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resting, remainingMs, readOnly, exercise.restEndsAt])

  const startSet = () => {
    if (exercise.tempoIntervalo <= 0) {
      completeSet(false)
      return
    }
    haptics.medium()
    setBusy(true)
    const startedAt = Date.now()
    setNow(startedAt)
    saveExerciseProgress(workoutId, exercise.id, exercise.setsDone, startedAt + exercise.tempoIntervalo * 1000)
      .catch(fail('Erro ao iniciar o descanso.'))
  }

  const skipExercise = () => {
    haptics.light()
    setBusy(true)
    finishExercise({ workoutId, exercise, userId, skipped: true }).catch(fail('Erro ao pular o exercício.'))
    onFinished()
  }

  const undoSet = () => {
    // Durante o descanso, desfazer cancela só a série em andamento
    if (resting) {
      saveExerciseProgress(workoutId, exercise.id, exercise.setsDone, null).catch(fail('Erro ao desfazer a série.'))
      return
    }
    reopenExercise(workoutId, exercise.id, Math.max(0, setsDone - 1)).catch(fail('Erro ao desfazer a série.'))
  }

  const resetExercise = () => {
    reopenExercise(workoutId, exercise.id, 0).catch(fail('Erro ao reiniciar o exercício.'))
  }

  const saveNote = (note: string) => {
    saveExerciseNote(workoutId, exercise.id, note).catch(fail('Erro ao salvar a anotação.'))
    toast.success(note.trim() ? 'Anotação salva' : 'Anotação removida')
  }

  const menuActions = [
    { label: 'Editar exercício', icon: Pencil, onPress: () => router.push({ pathname: '/workout/[workoutId]/exercise/[exerciseId]', params: { workoutId, exerciseId: exercise.id } }) },
    { label: exercise.nota ? 'Editar anotação' : 'Adicionar anotação', icon: NotebookPen, onPress: () => setNoteOpen(true) },
    ...(!readOnly && displayDone > 0 ? [{ label: 'Desfazer última série', icon: Undo2, onPress: undoSet }] : []),
    ...(!readOnly && (displayDone > 0 || finished) ? [{ label: 'Reiniciar exercício', icon: RotateCcw, onPress: resetExercise, destructive: true }] : []),
  ]

  return (
    <View className={cn('flex-1 rounded-3xl border overflow-hidden', finished ? 'bg-primary/5 border-primary/30' : 'bg-surface border-border')}>
      <ScrollView className="flex-1" contentContainerClassName="p-5 gap-5" showsVerticalScrollIndicator={false}>
        {/* Cabeçalho */}
        <View className="gap-1.5">
          <View className="flex-row items-center justify-between -mr-2 -mt-1">
            <Text variant="overline" tone="subtle">Exercício {position} de {total}</Text>
            <View className="flex-row items-center gap-1">
              {finished && (
                <View className={cn('flex-row items-center gap-1 px-2 py-1 rounded-full', exercise.isSkipped ? 'bg-surface-2' : 'bg-primary/15')}>
                  {exercise.isSkipped ? <CircleSlash size={12} color={colors.muted} /> : <Check size={12} color={colors.primary} strokeWidth={3} />}
                  <Text className={cn('text-xs font-semibold', exercise.isSkipped ? 'text-muted' : 'text-primary')}>
                    {exercise.isSkipped ? 'Pulado' : 'Concluído'}
                  </Text>
                </View>
              )}
              <IconButton icon={Ellipsis} accessibilityLabel="Opções do exercício" onPress={() => setMenuOpen(true)} />
            </View>
          </View>
          <Text variant="title" className="leading-8">{exercise.titulo}</Text>
        </View>

        {/* Prescrição */}
        {progressive ? (
          <View className="gap-2">
            <Text variant="label" tone="muted">Progressão de carga</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
              {progressive.map((set, index) => {
                const done = index < displayDone
                const current = !finished && !resting && index === exercise.setsDone
                return (
                  <View
                    key={index}
                    className={cn('px-3.5 py-2.5 rounded-2xl border min-w-24', current ? 'bg-primary/10 border-primary' : done ? 'bg-surface-2 border-transparent' : 'bg-surface border-border')}
                  >
                    <Text variant="caption" className={cn(current ? 'text-primary font-semibold' : 'text-muted')}>
                      Série {index + 1}{done ? ' ✓' : ''}
                    </Text>
                    <Text className={cn('text-lg font-bold', done && 'text-muted')}>
                      {set.reps}
                      <Text tone="subtle" className="text-sm font-medium"> × </Text>
                      {formatWeight(set.weight)}
                      <Text tone="subtle" className="text-sm font-medium"> kg</Text>
                    </Text>
                  </View>
                )
              })}
            </ScrollView>
          </View>
        ) : (
          <View className="flex-row gap-2">
            <Metric label="Séries" value={String(exercise.series)} />
            <Metric label="Repetições" value={String(exercise.repeticoes)} />
            <Metric label="Carga" value={exercise.peso > 0 ? formatWeight(exercise.peso) : '—'} suffix={exercise.peso > 0 ? 'kg' : undefined} />
          </View>
        )}

        <View className="flex-row items-center gap-2">
          <Timer size={16} color={colors.muted} />
          <Text tone="muted" className="text-sm">Descanso de {formatRest(exercise.tempoIntervalo)} entre as séries</Text>
        </View>

        {exercise.nota && (
          <View className="flex-row gap-2.5 bg-surface-2 rounded-2xl p-3.5">
            <StickyNote size={16} color={colors.muted} style={{ marginTop: 2 }} />
            <Text tone="muted" className="flex-1 text-sm leading-5">{exercise.nota}</Text>
          </View>
        )}

        {/* Progresso das séries */}
        {!readOnly && (
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text variant="label" tone="muted">Séries feitas</Text>
              <Text variant="label">{displayDone} de {exercise.series}</Text>
            </View>
            <View className="flex-row gap-1.5">
              {Array.from({ length: exercise.series }, (_, index) => (
                <View key={index} className={cn('flex-1 h-2 rounded-full', index < displayDone ? 'bg-primary' : 'bg-surface-3')} />
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Ações (fixas no rodapé, ao alcance do polegar) */}
      <View className="px-5 pb-5 pt-1 gap-2">
        {readOnly ? (
          <View className="bg-surface-2 rounded-2xl px-4 py-3">
            <Text tone="muted" className="text-sm text-center">Modo planejamento: a execução fica com o aluno.</Text>
          </View>
        ) : resting ? (
          <View className="gap-3">
            <View className="items-center gap-1">
              <Text variant="overline" tone="subtle">Descanso</Text>
              <Text className="text-6xl font-bold tabular-nums" accessibilityRole="timer">{formatClock(remainingMs / 1000)}</Text>
              <Text tone="muted" className="text-sm">
                {nextSet
                  ? `Série ${displayDone} de ${exercise.series} feita · próxima: ${nextSet.reps} × ${formatWeight(nextSet.weight)} kg`
                  : `Série ${displayDone} de ${exercise.series} feita`}
              </Text>
            </View>
            <ProgressBar value={restProgress} />
            <Button label="Pular descanso" variant="secondary" size="lg" onPress={() => completeSet(false)} disabled={busy} />
          </View>
        ) : finished ? (
          <View className="flex-row items-center justify-center gap-2 h-14 rounded-2xl bg-surface-2">
            {exercise.isSkipped ? <CircleSlash size={18} color={colors.muted} /> : <Check size={18} color={colors.primary} strokeWidth={3} />}
            <Text className={cn('text-base font-semibold', exercise.isSkipped ? 'text-muted' : 'text-primary')}>
              {exercise.isSkipped ? 'Você pulou esse hoje' : 'Exercício concluído'}
            </Text>
          </View>
        ) : (
          <>
            <Button label={`Concluir ${exercise.setsDone + 1}ª série`} size="lg" onPress={startSet} disabled={busy} />
            <Button label="Não fiz esse hoje" variant="ghost" size="sm" onPress={skipExercise} disabled={busy} className="self-center" />
          </>
        )}
      </View>

      <ActionSheet visible={menuOpen} onClose={() => setMenuOpen(false)} title={exercise.titulo} actions={menuActions} />
      {noteOpen && (
        <NoteSheet visible onClose={() => setNoteOpen(false)} initialNote={exercise.nota ?? ''} exerciseTitle={exercise.titulo} onSave={saveNote} />
      )}
    </View>
  )
}

function Metric({ label, value, suffix }: { label: string; value: string; suffix?: string }) {
  return (
    <View className="flex-1 bg-surface-2 rounded-2xl px-3.5 py-3 gap-0.5">
      <Text variant="caption" tone="muted">{label}</Text>
      <Text className="text-2xl font-bold">
        {value}
        {suffix && <Text tone="subtle" className="text-sm font-medium">{` ${suffix}`}</Text>}
      </Text>
    </View>
  )
}
