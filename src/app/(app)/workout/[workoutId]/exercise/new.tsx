import { doc, getDoc } from '@react-native-firebase/firestore'
import { router, useLocalSearchParams } from 'expo-router'
import { updateScheduledDays } from '@/data/streak'
import { addExercise } from '@/data/workouts'
import { ExerciseForm } from '@/features/workout/exercise-form'
import { trackExerciseAdded } from '@/lib/analytics'
import { db } from '@/lib/firebase'
import { haptics } from '@/lib/haptics'
import { settle } from '@/lib/writes'
import { useToast } from '@/providers/toast-provider'

export default function NewExerciseScreen() {
  const { workoutId } = useLocalSearchParams<{ workoutId: string }>()
  const toast = useToast()

  return (
    <ExerciseForm
      showLibrary
      submitLabel="Adicionar exercício"
      onSubmit={async input => {
        try {
          await settle(addExercise(workoutId, input))
          trackExerciseAdded(input.titulo)
          haptics.success()
          router.back()
          // Atualiza os dias agendados do dono do treino (pode ser um aluno do treinador)
          getDoc(doc(db, 'treinos', workoutId))
            .then(snapshot => {
              const ownerId = snapshot.data()?.usuarioID
              if (ownerId) updateScheduledDays(ownerId)
            })
            .catch(() => {})
        } catch {
          toast.error('Não foi possível adicionar o exercício.')
        }
      }}
    />
  )
}
