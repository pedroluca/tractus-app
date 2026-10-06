import { doc, getDoc } from '@react-native-firebase/firestore'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { LoadingState } from '@/components/ui/misc'
import type { Exercicio } from '@/data/types'
import { deleteExercise, mapExercise, updateExercise } from '@/data/workouts'
import { ExerciseForm } from '@/features/workout/exercise-form'
import { db } from '@/lib/firebase'
import { haptics } from '@/lib/haptics'
import { settle } from '@/lib/writes'
import { useToast } from '@/providers/toast-provider'

export default function EditExerciseScreen() {
  const { workoutId, exerciseId } = useLocalSearchParams<{ workoutId: string; exerciseId: string }>()
  const toast = useToast()
  const [exercise, setExercise] = useState<Exercicio | null>(null)

  useEffect(() => {
    getDoc(doc(db, 'treinos', workoutId, 'exercicios', exerciseId))
      .then(snapshot => {
        if (snapshot.exists()) setExercise(mapExercise(snapshot))
        else router.back()
      })
      .catch(() => router.back())
  }, [workoutId, exerciseId])

  if (!exercise) return <LoadingState />

  const confirmDelete = () => {
    Alert.alert('Excluir exercício', `Excluir "${exercise.titulo}" deste treino?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => {
          deleteExercise(workoutId, exerciseId).catch(() => toast.error('Não foi possível excluir o exercício.'))
          router.back()
        },
      },
    ])
  }

  return (
    <ExerciseForm
      initial={{
        titulo: exercise.titulo,
        series: exercise.series,
        repeticoes: exercise.repeticoes,
        peso: exercise.peso,
        tempoIntervalo: exercise.tempoIntervalo,
        usesProgressiveWeight: !!exercise.usesProgressiveWeight,
        progressiveSets: exercise.progressiveSets,
      }}
      submitLabel="Salvar"
      onDelete={confirmDelete}
      onSubmit={async input => {
        try {
          await settle(updateExercise(workoutId, exerciseId, input))
          haptics.success()
          router.back()
        } catch {
          toast.error('Não foi possível salvar o exercício.')
        }
      }}
    />
  )
}
