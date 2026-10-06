import type { ReactNode } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, { FadeIn, FadeOut, ZoomIn } from 'react-native-reanimated'
import { cn } from '@/lib/cn'

type DialogProps = {
  visible: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
}

/** Caixa centralizada para avisos e celebrações (confirmações simples usam Alert nativo) */
export function Dialog({ visible, onClose, children, className }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={() => onClose?.()}>
      {visible && (
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} className="absolute inset-0 bg-black/55">
            <Pressable accessibilityLabel="Fechar" className="flex-1" onPress={onClose} disabled={!onClose} />
          </Animated.View>
          <Animated.View
            entering={ZoomIn.springify().damping(20).stiffness(260)}
            className={cn('w-full max-w-sm bg-surface rounded-3xl p-6', className)}
          >
            {children}
          </Animated.View>
        </View>
      )}
    </Modal>
  )
}
