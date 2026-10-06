import { CircleAlert, CircleCheck, Info } from 'lucide-react-native'
import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import Animated, { FadeInUp, FadeOutUp } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text } from '@/components/ui/text'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'

type ToastType = 'success' | 'error' | 'info'
type ToastState = { id: number; message: string; type: ToastType }

type ToastContextValue = {
  show: (message: string, type?: ToastType) => void
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  const show = useCallback((message: string, type: ToastType = 'info') => {
    if (timer.current) clearTimeout(timer.current)
    if (type === 'error') haptics.error()
    setToast({ id: Date.now(), message, type })
    timer.current = setTimeout(() => setToast(null), type === 'error' ? 4000 : 2800)
  }, [])

  const value = useMemo<ToastContextValue>(() => ({
    show,
    success: message => show(message, 'success'),
    error: message => show(message, 'error'),
  }), [show])

  const Icon = toast?.type === 'success' ? CircleCheck : toast?.type === 'error' ? CircleAlert : Info
  const iconColor = toast?.type === 'success' ? colors.success : toast?.type === 'error' ? colors.danger : colors.info

  return (
    <ToastContext value={value}>
      {children}
      {toast && (
        <View pointerEvents="none" className="absolute left-0 right-0 items-center px-4" style={{ top: insets.top + 8 }}>
          <Animated.View
            key={toast.id}
            entering={FadeInUp.springify().damping(18)}
            exiting={FadeOutUp.duration(160)}
            accessibilityLiveRegion="polite"
            className="flex-row items-center gap-2.5 bg-surface border border-border rounded-2xl px-4 py-3 max-w-md"
            style={{ elevation: 6, shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 12, shadowOffset: { width: 0, height: 4 } }}
          >
            <Icon size={18} color={iconColor} />
            <Text className="text-sm font-medium flex-shrink">{toast.message}</Text>
          </Animated.View>
        </View>
      )}
    </ToastContext>
  )
}

export function useToast() {
  const context = use(ToastContext)
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider')
  return context
}
