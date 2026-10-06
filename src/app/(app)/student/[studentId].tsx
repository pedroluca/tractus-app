import { router, Stack, useLocalSearchParams } from 'expo-router'
import { ShieldAlert } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { EmptyState, LoadingState } from '@/components/ui/misc'
import { getUserProfile } from '@/data/profile'
import { canManageStudent } from '@/data/trainer'
import type { UserProfile } from '@/data/types'
import { TrainingView } from '@/features/training/training-view'
import { useCurrentUser } from '@/providers/session-provider'

/** Treinador montando os treinos de um aluno vinculado */
export default function StudentWorkoutsScreen() {
  const { studentId } = useLocalSearchParams<{ studentId: string }>()
  const profile = useCurrentUser()
  const [student, setStudent] = useState<UserProfile | null>(null)
  const [status, setStatus] = useState<'loading' | 'allowed' | 'denied'>('loading')

  useEffect(() => {
    let active = true
    Promise.all([canManageStudent(profile.id, studentId), getUserProfile(studentId)])
      .then(([allowed, studentProfile]) => {
        if (!active) return
        setStudent(studentProfile)
        setStatus(allowed && profile.isTrainer && studentProfile ? 'allowed' : 'denied')
      })
      .catch(() => active && setStatus('denied'))
    return () => {
      active = false
    }
  }, [profile.id, profile.isTrainer, studentId])

  return (
    <View className="flex-1 bg-background pt-2">
      <Stack.Screen options={{ title: student?.nome ? student.nome.split(' ')[0] : 'Aluno' }} />
      {status === 'loading' ? (
        <LoadingState />
      ) : status === 'denied' ? (
        <EmptyState
          icon={ShieldAlert}
          title="Sem acesso a esse aluno"
          description="Você só pode montar treinos de alunos com vínculo ativo."
          actionLabel="Voltar"
          onAction={() => router.back()}
        />
      ) : (
        <TrainingView viewer={profile} ownerId={studentId} />
      )}
    </View>
  )
}
