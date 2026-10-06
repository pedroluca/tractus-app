import type { LucideIcon } from 'lucide-react-native'
import { useEffect, type ReactNode } from 'react'
import { ActivityIndicator, Pressable, ScrollView, View, type ViewProps } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'
import { Button } from './button'
import { Text } from './text'

// ─── Chip ────────────────────────────────────────────────────────────────────

export function Chip({ label, selected, onPress, icon: Icon }: { label: string; selected?: boolean; onPress?: () => void; icon?: LucideIcon }) {
  const colors = useThemeColors()
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={() => {
        haptics.selection()
        onPress?.()
      }}
      className={cn('flex-row items-center gap-1.5 h-9 px-3.5 rounded-full border', selected ? 'bg-primary border-primary' : 'bg-surface border-border active:bg-surface-2')}
    >
      {Icon && <Icon size={15} color={selected ? colors.onPrimary : colors.muted} />}
      <Text className={cn('text-sm font-medium', selected ? 'text-on-primary' : 'text-foreground')}>{label}</Text>
    </Pressable>
  )
}

export function ChipRow({ children }: { children: ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 px-0.5" className="grow-0">
      {children}
    </ScrollView>
  )
}

// ─── Segmented control ───────────────────────────────────────────────────────

type SegmentedOption<T extends string> = { value: T; label: string; icon?: LucideIcon }

export function SegmentedControl<T extends string>({ options, value, onChange }: { options: SegmentedOption<T>[]; value: T; onChange: (value: T) => void }) {
  const colors = useThemeColors()
  return (
    <View className="flex-row bg-surface-2 rounded-xl p-1">
      {options.map(option => {
        const selected = option.value === value
        const Icon = option.icon
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (!selected) haptics.selection()
              onChange(option.value)
            }}
            className={cn('flex-1 flex-row items-center justify-center gap-1.5 h-9 rounded-lg', selected && 'bg-surface')}
            style={selected ? { elevation: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } } : undefined}
          >
            {Icon && <Icon size={16} color={selected ? colors.foreground : colors.muted} />}
            <Text className={cn('text-sm font-semibold', selected ? 'text-foreground' : 'text-muted')}>{option.label}</Text>
          </Pressable>
        )
      })}
    </View>
  )
}

// ─── Estados de tela ─────────────────────────────────────────────────────────

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction, className }: {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  className?: string
}) {
  const colors = useThemeColors()
  return (
    <View className={cn('items-center px-6 py-10 gap-3', className)}>
      <View className="w-14 h-14 rounded-2xl bg-surface-2 items-center justify-center mb-1">
        <Icon size={26} color={colors.muted} />
      </View>
      <Text variant="subheading" className="text-center">{title}</Text>
      {description && <Text tone="muted" className="text-sm text-center leading-5 max-w-xs">{description}</Text>}
      {actionLabel && onAction && <Button label={actionLabel} onPress={onAction} variant="secondary" className="mt-2" />}
    </View>
  )
}

export function LoadingState({ className }: { className?: string }) {
  const colors = useThemeColors()
  return (
    <View className={cn('flex-1 items-center justify-center py-16', className)}>
      <ActivityIndicator color={colors.primary} />
    </View>
  )
}

export function Skeleton({ className, ...props }: ViewProps & { className?: string }) {
  const opacity = useSharedValue(0.55)
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 800 }), -1, true)
  }, [opacity])
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }))
  return <Animated.View style={style} className={cn('bg-surface-2 rounded-xl', className)} {...props} />
}

// ─── Indicadores ─────────────────────────────────────────────────────────────

export function ProgressBar({ value, className, color }: { value: number; className?: string; color?: string }) {
  const colors = useThemeColors()
  const clamped = Math.min(1, Math.max(0, value))
  return (
    <View className={cn('h-1.5 rounded-full bg-surface-3 overflow-hidden', className)}>
      <View className="h-full rounded-full" style={{ width: `${clamped * 100}%`, backgroundColor: color ?? colors.primary }} />
    </View>
  )
}

export function StatTile({ label, value, suffix, color, icon: Icon, onPress, className }: {
  label: string
  value: string | number
  suffix?: string
  color?: string
  icon?: LucideIcon
  onPress?: () => void
  className?: string
}) {
  const colors = useThemeColors()
  const tint = color ?? colors.foreground
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('flex-1 bg-surface-2 rounded-2xl px-3.5 py-3 gap-1', onPress && 'active:bg-surface-3', className)}
    >
      <View className="flex-row items-center gap-1.5">
        {Icon && <Icon size={14} color={color ?? colors.muted} />}
        <Text variant="caption" tone="muted" numberOfLines={1}>{label}</Text>
      </View>
      <Text className="text-2xl font-bold" style={{ color: tint }} numberOfLines={1}>
        {value}
        {suffix && <Text className="text-sm font-medium" tone="subtle">{` ${suffix}`}</Text>}
      </Text>
    </Pressable>
  )
}

export function Divider({ className }: { className?: string }) {
  return <View className={cn('h-px bg-border', className)} />
}

/** Aviso destacado (premium, privacidade, erros de importação...) */
export function Callout({ tone = 'info', icon: Icon, title, children }: { tone?: 'info' | 'warning' | 'danger' | 'success'; icon?: LucideIcon; title?: string; children: ReactNode }) {
  const colors = useThemeColors()
  const color = { info: colors.info, warning: colors.warning, danger: colors.danger, success: colors.success }[tone]
  return (
    <View className="flex-row gap-3 rounded-2xl p-3.5" style={{ backgroundColor: `${color}14` }}>
      {Icon && <Icon size={18} color={color} style={{ marginTop: 1 }} />}
      <View className="flex-1 gap-0.5">
        {title && <Text className="text-sm font-semibold" style={{ color }}>{title}</Text>}
        {typeof children === 'string' ? <Text className="text-sm leading-5" tone="muted">{children}</Text> : children}
      </View>
    </View>
  )
}
