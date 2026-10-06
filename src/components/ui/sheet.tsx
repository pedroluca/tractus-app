import type { ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { KeyboardAvoidingView } from 'react-native-keyboard-controller'
import Animated, { Easing, FadeIn, FadeOut, SlideOutDown, withTiming, type EntryAnimationsValues } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { cn } from '@/lib/cn'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

type SheetProps = {
  visible: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  /** Rola o conteúdo quando ele é maior que a tela */
  scrollable?: boolean
  dismissable?: boolean
  contentClassName?: string
}

// Sobe a folha animando translateY. O SlideInDown anima a posição de layout (originY) e, no Android,
// o Modal nasce com a altura da tela sem as barras do sistema e só depois cresce para a tela cheia:
// a animação terminava na posição antiga e deixava um vão entre a folha e a borda de baixo.
function slideUp(values: EntryAnimationsValues) {
  'worklet'
  return {
    initialValues: { transform: [{ translateY: values.windowHeight }] },
    animations: { transform: [{ translateY: withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) }) }] },
  }
}

/** Folha que sobe da parte de baixo da tela (ações rápidas, formulários curtos, detalhes) */
export function Sheet({ visible, onClose, title, description, children, scrollable, dismissable = true, contentClassName }: SheetProps) {
  const insets = useSafeAreaInsets()
  const close = dismissable ? onClose : () => {}

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent navigationBarTranslucent onRequestClose={close}>
      {visible && (
        <KeyboardAvoidingView behavior="padding" className="flex-1 justify-end">
          <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(150)} className="absolute inset-0 bg-black/50">
            <Pressable accessibilityLabel="Fechar" className="flex-1" onPress={close} />
          </Animated.View>

          <Animated.View
            entering={slideUp}
            exiting={SlideOutDown.duration(180)}
            className="bg-surface rounded-t-3xl max-h-[88%] w-full max-w-xl self-center"
            style={{ paddingBottom: Math.max(insets.bottom, 16) }}
          >
            <View className="items-center pt-2.5 pb-1">
              <View className="w-10 h-1 rounded-full bg-surface-3" />
            </View>
            {(title || description) && (
              <View className="px-5 pt-2 pb-3 gap-1">
                {title && <Text variant="heading">{title}</Text>}
                {description && <Text tone="muted" className="text-sm leading-5">{description}</Text>}
              </View>
            )}
            {scrollable ? (
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName={cn('px-5 pb-2', contentClassName)}>
                {children}
              </ScrollView>
            ) : (
              <View className={cn('px-5', contentClassName)}>{children}</View>
            )}
          </Animated.View>
        </KeyboardAvoidingView>
      )}
    </Modal>
  )
}

type ActionItem = {
  label: string
  icon?: React.ComponentType<{ size?: number; color?: string }>
  destructive?: boolean
  onPress: () => void
}

/** Lista de ações (equivalente ao menu de contexto do web) */
export function ActionSheet({ visible, onClose, title, actions }: {
  visible: boolean
  onClose: () => void
  title?: string
  actions: ActionItem[]
}) {
  const colors = useThemeColors()
  return (
    <Sheet visible={visible} onClose={onClose} title={title}>
      <View className="pb-2">
        {actions.map(action => {
          const Icon = action.icon
          const color = action.destructive ? colors.danger : colors.foreground
          return (
            <Pressable
              key={action.label}
              accessibilityRole="button"
              onPress={() => {
                onClose()
                // Deixa a folha fechar antes de abrir outra tela/modal
                setTimeout(action.onPress, 200)
              }}
              className="flex-row items-center gap-3.5 py-3.5 px-1 rounded-xl active:bg-surface-2"
            >
              {Icon && <Icon size={20} color={color} />}
              <Text className={cn('text-base', action.destructive ? 'text-danger' : 'text-foreground')}>{action.label}</Text>
            </Pressable>
          )
        })}
      </View>
    </Sheet>
  )
}
