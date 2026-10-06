import { NativeTabs } from 'expo-router/unstable-native-tabs'
import { useEffect, useState } from 'react'
import { subscribePendingRequestsCount } from '@/data/friends'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

// Tab bar nativa: Material 3 no Android e UITabBar no iOS
export default function TabsLayout() {
  const colors = useThemeColors()
  const profile = useCurrentUser()
  const [pendingFriends, setPendingFriends] = useState(0)

  useEffect(() => subscribePendingRequestsCount(profile.id, setPendingFriends), [profile.id])

  return (
    <NativeTabs
      backgroundColor={colors.surface}
      indicatorColor={`${colors.primary}2E`}
      iconColor={{ default: colors.muted, selected: colors.primary }}
      labelStyle={{ default: { color: colors.muted }, selected: { color: colors.foreground } }}
      rippleColor={`${colors.primary}22`}
      badgeBackgroundColor={colors.danger}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>Treino</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="dumbbell.fill" md="fitness_center" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="friends">
        <NativeTabs.Trigger.Label>Amigos</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.2.fill" md="group" />
        <NativeTabs.Trigger.Badge hidden={pendingFriends === 0}>{pendingFriends > 9 ? '9+' : String(pendingFriends)}</NativeTabs.Trigger.Badge>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="coaching">
        <NativeTabs.Trigger.Label>{profile.isTrainer ? 'Alunos' : 'Treinador'}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="graduationcap.fill" md="school" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="progress">
        <NativeTabs.Trigger.Label>Progresso</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="chart.line.uptrend.xyaxis" md="trending_up" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Label>Perfil</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person.crop.circle.fill" md="account_circle" />
      </NativeTabs.Trigger>
    </NativeTabs>
  )
}
