import type { ReactNode } from 'react'
import { Modal, Pressable, View } from 'react-native'
import Animated, { FadeIn, FadeOut, withTiming, ZoomIn, type EntryAnimationsValues } from 'react-native-reanimated'
import { cn } from '@/lib/cn'

type DialogProps = {
  visible: boolean
  onClose?: () => void
  children: ReactNode
  className?: string
  /** "pop" dá o pulo com mola, reservado para celebrações; o padrão só aparece suave */
  animation?: 'subtle' | 'pop'
}

const subtleEntering = (_values: EntryAnimationsValues) => {
  'worklet'
  return {
    initialValues: { opacity: 0, transform: [{ scale: 0.96 }] },
    animations: {
      opacity: withTiming(1, { duration: 160 }),
      transform: [{ scale: withTiming(1, { duration: 180 }) }],
    },
  }
}

const popEntering = ZoomIn.springify().damping(20).stiffness(260)

/** Caixa centralizada para avisos e celebrações (confirmações usam useConfirm) */
export function Dialog({ visible, onClose, children, className, animation = 'subtle' }: DialogProps) {
  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={() => onClose?.()}>
      {visible && (
        <View className="flex-1 items-center justify-center px-6">
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} className="absolute inset-0 bg-black/55">
            <Pressable accessibilityLabel="Fechar" className="flex-1" onPress={onClose} disabled={!onClose} />
          </Animated.View>
          <Animated.View
            entering={animation === 'pop' ? popEntering : subtleEntering}
            className={cn('w-full max-w-sm bg-surface rounded-3xl p-6', className)}
          >
            {children}
          </Animated.View>
        </View>
      )}
    </Modal>
  )
}
