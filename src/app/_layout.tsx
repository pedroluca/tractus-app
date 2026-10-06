import '@/global.css'

import { Stack, usePathname } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { KeyboardProvider } from 'react-native-keyboard-controller'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { trackScreen } from '@/lib/analytics'
import { initPush } from '@/lib/push'
import { SessionProvider, useSession } from '@/providers/session-provider'
import { ThemeProvider, useAppTheme } from '@/providers/theme-provider'
import { ToastProvider } from '@/providers/toast-provider'

SplashScreen.preventAutoHideAsync()
SplashScreen.setOptions({ fade: true, duration: 250 })
initPush()

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <KeyboardProvider>
          <SessionProvider>
            <ThemeProvider>
              <ToastProvider>
                <RootNavigator />
              </ToastProvider>
            </ThemeProvider>
          </SessionProvider>
        </KeyboardProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )
}

function RootNavigator() {
  const { initializing, profile } = useSession()
  const { isDark } = useAppTheme()
  const pathname = usePathname()
  // Perfil completo e ativo: no cadastro o documento pode existir por um instante sem os dados
  const isSignedIn = !!profile && typeof profile.nome === 'string' && profile.isActive !== false

  useEffect(() => {
    if (!initializing) SplashScreen.hideAsync()
  }, [initializing])

  useEffect(() => {
    if (pathname) trackScreen(pathname)
  }, [pathname])

  if (initializing) return null

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, animation: 'fade' }}>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(app)" />
        </Stack.Protected>
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
      </Stack>
    </>
  )
}
