import { View } from 'react-native'
import { StreakPill } from '@/components/streak-pill'
import { TabHeader } from '@/components/ui/screen'
import { TrainingView } from '@/features/training/training-view'
import { useCurrentUser } from '@/providers/session-provider'

function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

export default function TrainingScreen() {
  const profile = useCurrentUser()
  const firstName = profile.nome?.split(' ')[0]

  return (
    <View className="flex-1 bg-background">
      <TabHeader title="Treino" subtitle={firstName ? `${greeting()}, ${firstName}` : undefined} right={<StreakPill />} />
      <TrainingView viewer={profile} ownerId={profile.id} />
    </View>
  )
}
