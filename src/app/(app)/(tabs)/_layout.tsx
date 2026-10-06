import { Tabs } from 'expo-router'
import type { BottomTabNavigationOptions } from 'expo-router/tabs'
import { CircleUserRound, Dumbbell, GraduationCap, UsersRound, type LucideIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { FloatingTabBar, TabBarInsetProvider } from '@/components/floating-tab-bar'
import { subscribePendingRequestsCount } from '@/data/friends'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

// Traço mais grosso na aba ativa, já que os ícones do lucide não têm versão preenchida
function tabIcon(Icon: LucideIcon): BottomTabNavigationOptions['tabBarIcon'] {
  return function TabIcon({ focused, color, size }) {
    return <Icon size={size} color={color} strokeWidth={focused ? 2.4 : 2} />
  }
}

// Tab bar própria: cápsula flutuante com efeito de vidro (components/floating-tab-bar)
export default function TabsLayout() {
  const colors = useThemeColors()
  const profile = useCurrentUser()
  const [pendingFriends, setPendingFriends] = useState(0)

  useEffect(() => subscribePendingRequestsCount(profile.id, setPendingFriends), [profile.id])

  return (
    <TabBarInsetProvider>
      <Tabs
        tabBar={props => <FloatingTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'shift',
          sceneStyle: { backgroundColor: colors.background },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Treino', tabBarIcon: tabIcon(Dumbbell) }} />
        <Tabs.Screen
          name="friends"
          options={{
            title: 'Amigos',
            tabBarIcon: tabIcon(UsersRound),
            tabBarBadge: pendingFriends === 0 ? undefined : pendingFriends > 9 ? '9+' : pendingFriends,
          }}
        />
        <Tabs.Screen name="coaching" options={{ title: profile.isTrainer ? 'Alunos' : 'Treinador', tabBarIcon: tabIcon(GraduationCap) }} />
        <Tabs.Screen name="profile" options={{ title: 'Perfil', tabBarIcon: tabIcon(CircleUserRound) }} />
      </Tabs>
    </TabBarInsetProvider>
  )
}
