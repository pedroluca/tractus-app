import { Stack } from 'expo-router'
import { useThemeColors } from '@/theme/colors'

export const unstable_settings = {
  initialRouteName: 'welcome',
}

export default function AuthLayout() {
  const colors = useThemeColors()
  return (
    <Stack
      screenOptions={{
        headerShadowVisible: false,
        headerTitle: '',
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.foreground,
        contentStyle: { backgroundColor: colors.background },
      }}
    >
      <Stack.Screen name="welcome" options={{ headerShown: false }} />
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  )
}
