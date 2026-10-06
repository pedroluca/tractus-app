import type { ReactNode } from 'react'
import { RefreshControl, View } from 'react-native'
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTabBarInset } from '@/components/floating-tab-bar'
import { cn } from '@/lib/cn'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

/** Cabeçalho das telas de aba (as telas empilhadas usam o header nativo do Stack) */
export function TabHeader({ title, subtitle, right }: { title: string; subtitle?: string; right?: ReactNode }) {
  const insets = useSafeAreaInsets()
  return (
    <View style={{ paddingTop: insets.top + 8 }} className="px-5 pb-3 flex-row items-end justify-between gap-3 bg-background">
      <View className="flex-1">
        {subtitle && <Text variant="caption" tone="muted" className="mb-0.5">{subtitle}</Text>}
        <Text variant="display" numberOfLines={1}>{title}</Text>
      </View>
      {right && <View className="flex-row items-center gap-2 pb-1">{right}</View>}
    </View>
  )
}

type ScreenScrollProps = {
  children: ReactNode
  /** Espaço extra no fim para a barra do sistema (nas abas, o espaço da tab bar já é reservado) */
  bottomInset?: boolean
  refreshing?: boolean
  onRefresh?: () => void
  contentClassName?: string
  header?: ReactNode
}

/**
 * Container rolável padrão: largura máxima para tablets, espaçamento consistente
 * e teclado que não cobre o campo em foco.
 */
export function ScreenScroll({ children, bottomInset = true, refreshing, onRefresh, contentClassName, header }: ScreenScrollProps) {
  const insets = useSafeAreaInsets()
  const tabBarInset = useTabBarInset()
  const colors = useThemeColors()
  return (
    <View className="flex-1 bg-background">
      {header}
      <KeyboardAwareScrollView
        bottomOffset={24}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: tabBarInset ? tabBarInset + 24 : bottomInset ? insets.bottom + 32 : 24 }}
        refreshControl={onRefresh ? (
          <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} colors={[colors.primary]} tintColor={colors.primary} progressBackgroundColor={colors.surface} />
        ) : undefined}
      >
        <View className={cn('w-full max-w-2xl self-center px-4 pt-2 gap-5', contentClassName)}>{children}</View>
      </KeyboardAwareScrollView>
    </View>
  )
}

export function SectionTitle({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <View className="flex-row items-center justify-between px-1">
      <Text variant="overline" tone="subtle">{title}</Text>
      {action}
    </View>
  )
}
