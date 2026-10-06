import { doc, onSnapshot } from '@react-native-firebase/firestore'
import { router, useLocalSearchParams } from 'expo-router'
import { ChevronDown, ChevronUp, Pencil, Plus, RotateCcw, Share2, Trash2 } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { ListRow, ListSection } from '@/components/ui/list'
import { Callout, LoadingState } from '@/components/ui/misc'
import { ScreenScroll, SectionTitle } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { updateScheduledDays } from '@/data/streak'
import type { Exercicio, Treino } from '@/data/types'
import { WEEK_DAYS } from '@/data/week-days'
import {
  deleteExercise,
  deleteWorkoutWithExercises,
  getUserWorkouts,
  resetWorkoutExercises,
  sortExercises,
  subscribeWorkoutExercises,
  updateWorkout,
} from '@/data/workouts'
import { ShareWorkoutSheet } from '@/features/profile/share-workout-sheet'
import { cn } from '@/lib/cn'
import { formatRest, formatWeight } from '@/lib/dates'
import { db } from '@/lib/firebase'
import { haptics } from '@/lib/haptics'
import { settle } from '@/lib/writes'
import { useCurrentUser } from '@/providers/session-provider'
import { useConfirm } from '@/providers/confirm-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

export default function EditWorkoutScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>()
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()
  const confirm = useConfirm()

  const [workout, setWorkout] = useState<Treino | null | undefined>(undefined)
  const [exercises, setExercises] = useState<Exercicio[] | null>(null)
  const [takenDays, setTakenDays] = useState<Set<string>>(new Set())
  const [name, setName] = useState<string | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const [order, setOrder] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)
  const [sharing, setSharing] = useState(false)

  useEffect(() => onSnapshot(
    doc(db, 'treinos', workoutId),
    snapshot => setWorkout(snapshot.exists() ? ({ id: snapshot.id, ...snapshot.data() } as Treino) : null),
    () => setWorkout(null),
  ), [workoutId])

  useEffect(() => subscribeWorkoutExercises(workoutId, setExercises, () => setExercises([])), [workoutId])

  const ownerId = workout?.usuarioID
  useEffect(() => {
    if (!ownerId) return
    getUserWorkouts(ownerId)
      .then(list => setTakenDays(new Set(list.filter(item => item.id !== workoutId).map(item => item.dia))))
      .catch(() => {})
  }, [ownerId, workoutId])

  // Rascunho local: começa com o que está salvo e só grava ao tocar em "Salvar"
  const currentName = name ?? workout?.musculo ?? ''
  const currentDay = day ?? workout?.dia ?? ''
  const sorted = useMemo(() => sortExercises(exercises ?? [], order ?? workout?.exerciseOrder), [exercises, order, workout?.exerciseOrder])

  const move = (index: number, direction: -1 | 1) => {
    const ids = sorted.map(exercise => exercise.id)
    const target = index + direction
    if (target < 0 || target >= ids.length) return
    haptics.selection()
    ;[ids[index], ids[target]] = [ids[target], ids[index]]
    setOrder(ids)
  }

  const hasChanges = (name !== null && name.trim() !== workout?.musculo) || (day !== null && day !== workout?.dia) || order !== null

  const save = async () => {
    if (!workout) return
    if (!currentName.trim()) {
      toast.error('O treino precisa de um nome.')
      return
    }
    setSaving(true)
    try {
      await settle(updateWorkout(workout.id, { musculo: currentName.trim(), dia: currentDay, exerciseOrder: sorted.map(exercise => exercise.id) }))
      if (day !== null && day !== workout.dia) updateScheduledDays(workout.usuarioID)
      haptics.success()
      router.back()
    } catch {
      toast.error('Não foi possível salvar as alterações.')
      setSaving(false)
    }
  }

  const confirmDeleteExercise = (exercise: Exercicio) => {
    confirm({
      title: 'Excluir exercício',
      message: `Excluir "${exercise.titulo}" deste treino?`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: () => {
        setOrder(current => (current ? current.filter(id => id !== exercise.id) : current))
        deleteExercise(workoutId, exercise.id).catch(() => toast.error('Não foi possível excluir o exercício.'))
      },
    })
  }

  const confirmReset = () => {
    confirm({
      title: 'Reiniciar progresso',
      message: 'Desmarcar todos os exercícios deste treino feitos hoje?',
      confirmLabel: 'Reiniciar',
      icon: RotateCcw,
      tone: 'warning',
      onConfirm: () => resetWorkoutExercises(workoutId)
        .then(() => toast.success('Progresso reiniciado'))
        .catch(() => toast.error('Não foi possível reiniciar.')),
    })
  }

  const confirmDeleteWorkout = () => {
    if (!workout) return
    confirm({
      title: 'Excluir treino',
      message: `Excluir "${workout.musculo}" e todos os exercícios dele? Essa ação não pode ser desfeita.`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: async () => {
        try {
          await deleteWorkoutWithExercises(workout.id)
          updateScheduledDays(workout.usuarioID)
          router.back()
        } catch {
          toast.error('Não foi possível excluir o treino.')
        }
      },
    })
  }

  if (workout === undefined) return <LoadingState />
  if (workout === null) {
    return (
      <ScreenScroll contentClassName="pt-4">
        <Callout tone="warning">Este treino não existe mais.</Callout>
      </ScreenScroll>
    )
  }

  const canEdit = workout.usuarioID === profile.id || workout.createdByUserId === profile.id

  return (
    <ScreenScroll contentClassName="pt-4 gap-6">
      {!canEdit && <Callout tone="info">Este treino foi criado por outra pessoa; só ela pode alterá-lo.</Callout>}

      <TextField label="Nome do treino" value={currentName} onChangeText={setName} placeholder="Ex.: Peito e Tríceps" maxLength={80} editable={canEdit} />

      <View className="gap-2">
        <Text variant="label" tone="muted">Dia da semana</Text>
        <View className="flex-row gap-1.5">
          {WEEK_DAYS.map(weekDay => {
            const selected = weekDay === currentDay
            const taken = takenDays.has(weekDay) && weekDay !== workout.dia
            return (
              <Pressable
                key={weekDay}
                accessibilityRole="radio"
                accessibilityLabel={`${weekDay}${taken ? ', já tem treino' : ''}`}
                accessibilityState={{ checked: selected, disabled: taken }}
                disabled={taken || !canEdit}
                onPress={() => {
                  haptics.selection()
                  setDay(weekDay)
                }}
                className={cn('flex-1 h-11 rounded-xl items-center justify-center border', selected ? 'bg-primary border-primary' : 'bg-surface border-border', taken && 'opacity-35')}
              >
                <Text className={cn('text-sm font-semibold', selected ? 'text-on-primary' : 'text-foreground')}>{weekDay.slice(0, 3)}</Text>
              </Pressable>
            )
          })}
        </View>
        <Text variant="caption" tone="subtle">Dias apagados já têm outro treino.</Text>
      </View>

      <View className="gap-2">
        <SectionTitle
          title={`Exercícios${exercises ? ` · ${exercises.length}` : ''}`}
          action={canEdit ? (
            <Button
              label="Adicionar"
              icon={Plus}
              variant="ghost"
              size="sm"
              className="-my-2 -mr-2"
              onPress={() => router.push({ pathname: '/workout/[workoutId]/exercise/new', params: { workoutId } })}
            />
          ) : undefined}
        />
        {exercises === null ? (
          <LoadingState className="py-8" />
        ) : sorted.length === 0 ? (
          <Card className="p-4">
            <Text tone="muted" className="text-sm text-center">Nenhum exercício ainda.</Text>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {sorted.map((exercise, index) => (
              <View key={exercise.id}>
                {index > 0 && <View className="h-px bg-border mx-4" />}
                <View className="flex-row items-center pl-4 pr-2 py-2 gap-1">
                  <Pressable
                    className="flex-1 py-1.5 gap-0.5"
                    disabled={!canEdit}
                    onPress={() => router.push({ pathname: '/workout/[workoutId]/exercise/[exerciseId]', params: { workoutId, exerciseId: exercise.id } })}
                  >
                    <Text className="text-base font-medium" numberOfLines={1}>{exercise.titulo}</Text>
                    <Text variant="caption" tone="muted">
                      {exercise.usesProgressiveWeight && exercise.progressiveSets?.length
                        ? `${exercise.series} séries com progressão`
                        : `${exercise.series} × ${exercise.repeticoes}${exercise.peso ? ` · ${formatWeight(exercise.peso)} kg` : ''}`}
                      {` · ${formatRest(exercise.tempoIntervalo)}`}
                    </Text>
                  </Pressable>
                  {canEdit && (
                    <>
                      <IconButton icon={ChevronUp} size={36} iconSize={18} accessibilityLabel="Mover para cima" disabled={index === 0} onPress={() => move(index, -1)} />
                      <IconButton icon={ChevronDown} size={36} iconSize={18} accessibilityLabel="Mover para baixo" disabled={index === sorted.length - 1} onPress={() => move(index, 1)} />
                      <IconButton icon={Trash2} size={36} iconSize={18} color={colors.danger} accessibilityLabel="Excluir exercício" onPress={() => confirmDeleteExercise(exercise)} />
                    </>
                  )}
                </View>
              </View>
            ))}
          </Card>
        )}
      </View>

      <ListSection title="Ações">
        <ListRow title="Compartilhar treino" icon={Share2} onPress={() => setSharing(true)} />
        {canEdit && <ListRow title="Reiniciar progresso de hoje" icon={RotateCcw} iconColor={colors.warning} onPress={confirmReset} />}
        {canEdit && <ListRow title="Excluir treino" icon={Trash2} destructive onPress={confirmDeleteWorkout} />}
      </ListSection>

      {canEdit && (
        <Button label="Salvar alterações" icon={Pencil} size="lg" loading={saving} disabled={!hasChanges} onPress={save} />
      )}

      <ShareWorkoutSheet workout={sharing ? workout : null} ownerId={workout.usuarioID} onClose={() => setSharing(false)} />
    </ScreenScroll>
  )
}
