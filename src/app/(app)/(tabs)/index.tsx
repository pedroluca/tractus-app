import { View } from 'react-native'
import { useTabBarInset } from '@/components/floating-tab-bar'
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
  const tabBarInset = useTabBarInset()
  const firstName = profile.nome?.split(' ')[0]

  return (
    // O carrossel ocupa a altura toda: termina acima da cápsula em vez de passar por trás dela
    <View className="flex-1 bg-background" style={{ paddingBottom: tabBarInset }}>
      <TabHeader title="Treino" subtitle={firstName ? `${greeting()}, ${firstName}` : undefined} right={<StreakPill />} />
      <TrainingView viewer={profile} ownerId={profile.id} />
    </View>
  )
}
