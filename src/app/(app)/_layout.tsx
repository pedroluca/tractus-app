import { Stack } from 'expo-router'
import { AppOverlays } from '@/components/overlays'
import { CurrentUserProvider } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

export const unstable_settings = {
  initialRouteName: '(tabs)',
}

export default function AppLayout() {
  const colors = useThemeColors()

  return (
    <CurrentUserProvider>
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.foreground,
          headerTitleStyle: { fontWeight: '600' },
          headerBackButtonDisplayMode: 'minimal',
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

        {/* Telas empilhadas */}
        <Stack.Screen name="student/[studentId]" options={{ title: 'Treinos do aluno' }} />
        <Stack.Screen name="friend/[id]/index" options={{ title: '' }} />
        <Stack.Screen name="friend/[id]/friends" options={{ title: 'Amigos' }} />
        <Stack.Screen name="friend/[id]/badges" options={{ title: 'Conquistas' }} />
        <Stack.Screen name="profile/badges" options={{ title: 'Conquistas' }} />
        <Stack.Screen name="profile/log" options={{ title: 'Histórico' }} />
        <Stack.Screen name="profile/body-metrics" options={{ title: 'Métricas corporais' }} />
        <Stack.Screen name="profile/streak-calendar" options={{ title: 'Calendário de streak' }} />
        <Stack.Screen name="settings/index" options={{ title: 'Configurações' }} />
        <Stack.Screen name="settings/appearance" options={{ title: 'Aparência' }} />
        <Stack.Screen name="settings/privacy" options={{ title: 'Privacidade do perfil' }} />
        <Stack.Screen name="settings/password" options={{ title: 'Alterar senha' }} />
        <Stack.Screen name="settings/support" options={{ title: 'Ajuda e suporte' }} />

        {/* Formulários abertos como modal (sobem por cima da tela atual) */}
        <Stack.Screen name="workout/new" options={{ presentation: 'modal', title: 'Novo treino' }} />
        <Stack.Screen name="workout/[workoutId]/edit" options={{ presentation: 'modal', title: 'Editar treino' }} />
        <Stack.Screen name="workout/[workoutId]/exercise/new" options={{ presentation: 'modal', title: 'Novo exercício' }} />
        <Stack.Screen name="workout/[workoutId]/exercise/[exerciseId]" options={{ presentation: 'modal', title: 'Editar exercício' }} />
        <Stack.Screen name="friends/add" options={{ presentation: 'modal', title: 'Adicionar amigo' }} />
        <Stack.Screen name="friends/requests" options={{ presentation: 'modal', title: 'Solicitações' }} />
        <Stack.Screen name="profile/edit" options={{ presentation: 'modal', title: 'Editar perfil' }} />
        <Stack.Screen name="profile/measurement" options={{ presentation: 'modal', title: 'Nova medição' }} />
        <Stack.Screen name="transfer/import" options={{ presentation: 'modal', title: 'Importar treinos' }} />
        <Stack.Screen name="premium" options={{ presentation: 'modal', title: 'Tractus Premium' }} />
      </Stack>
      <AppOverlays />
    </CurrentUserProvider>
  )
}
