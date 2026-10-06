import { useEffect, useMemo, useState } from 'react'
import { getUserProfile } from '@/data/profile'
import type { Exercicio, Treino } from '@/data/types'
import { WEEK_DAYS } from '@/data/week-days'
import { sortExercises, subscribeUserWorkouts, subscribeWorkoutExercises } from '@/data/workouts'

type Options = {
  /** Dono dos treinos exibidos */
  userId: string
  /** Quando um treinador gerencia um aluno: só os treinos que ele criou são editáveis */
  managerId?: string
  dayIndex: number
}

/** Treinos e exercícios em tempo real para a tela de treino */
export function useTrainingData({ userId, managerId, dayIndex }: Options) {
  const [allWorkouts, setAllWorkouts] = useState<Treino[] | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [rawExercises, setRawExercises] = useState<{ workoutId: string; list: Exercicio[] } | null>(null)
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({})

  useEffect(() => subscribeUserWorkouts(userId, setAllWorkouts, () => setAllWorkouts([])), [userId])

  const day = WEEK_DAYS[dayIndex]
  const visibleWorkouts = useMemo(() => {
    const list = allWorkouts ?? []
    return managerId ? list.filter(workout => (workout.createdByUserId || workout.usuarioID) === managerId) : list
  }, [allWorkouts, managerId])

  const dayWorkouts = useMemo(
    () => visibleWorkouts.filter(workout => workout.dia.toLowerCase() === day.toLowerCase()),
    [visibleWorkouts, day],
  )

  const workout = dayWorkouts.find(item => item.id === selectedId) ?? dayWorkouts[0] ?? null
  const workoutId = workout?.id

  useEffect(() => {
    if (!workoutId) return
    return subscribeWorkoutExercises(workoutId, list => setRawExercises({ workoutId, list }), () => setRawExercises({ workoutId, list: [] }))
  }, [workoutId])

  const exerciseOrderKey = workout?.exerciseOrder?.join(',')
  const exercises = useMemo(() => {
    if (!workout || rawExercises?.workoutId !== workout.id) return null
    return sortExercises(rawExercises.list, workout.exerciseOrder)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawExercises, workout?.id, exerciseOrderKey])

  // Nomes de quem criou treinos para o usuário (ex.: o treinador)
  const creatorIdsKey = Array.from(new Set((allWorkouts ?? [])
    .map(item => item.createdByUserId || item.usuarioID)
    .filter(id => id && id !== userId))).sort().join(',')

  useEffect(() => {
    if (!creatorIdsKey) return
    let active = true
    Promise.all(creatorIdsKey.split(',').map(id => getUserProfile(id).catch(() => null))).then(profiles => {
      if (!active) return
      const names: Record<string, string> = {}
      profiles.forEach(profile => {
        if (profile) names[profile.id] = profile.nome || 'Treinador'
      })
      setCreatorNames(names)
    })
    return () => {
      active = false
    }
  }, [creatorIdsKey])

  const creatorLabel = (item: Treino) => {
    const creatorId = item.createdByUserId || item.usuarioID
    if (!creatorId || creatorId === userId) return null
    return creatorNames[creatorId] ?? 'Treinador'
  }

  // Dias com treino (para os pontinhos na barra de dias)
  const daysWithWorkout = useMemo(() => new Set(visibleWorkouts.map(item => item.dia.toLowerCase())), [visibleWorkouts])

  // Treinador não pode criar treino num dia que já tem treino de outra pessoa
  const dayTakenByOther = !!managerId && !workout && (allWorkouts ?? []).some(
    item => item.dia.toLowerCase() === day.toLowerCase() && (item.createdByUserId || item.usuarioID) !== managerId,
  )

  return {
    loading: allWorkouts === null,
    day,
    dayWorkouts,
    workout,
    exercises,
    selectWorkout: setSelectedId,
    creatorLabel,
    daysWithWorkout,
    dayTakenByOther,
  }
}
