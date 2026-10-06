import type { LucideIcon } from 'lucide-react-native'
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { useThemeColors, type ThemeColors } from '@/theme/colors'
import { Text } from './text'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'danger-soft'
type Size = 'sm' | 'md' | 'lg'

const containerByVariant: Record<Variant, string> = {
  primary: 'bg-primary',
  secondary: 'bg-surface-2',
  outline: 'bg-transparent border border-border',
  ghost: 'bg-transparent',
  danger: 'bg-danger',
  'danger-soft': 'bg-danger/10',
}

const textByVariant: Record<Variant, string> = {
  primary: 'text-on-primary',
  secondary: 'text-foreground',
  outline: 'text-foreground',
  ghost: 'text-primary',
  danger: 'text-white',
  'danger-soft': 'text-danger',
}

const contentColor = (variant: Variant, colors: ThemeColors) => ({
  primary: colors.onPrimary,
  secondary: colors.foreground,
  outline: colors.foreground,
  ghost: colors.primary,
  danger: '#ffffff',
  'danger-soft': colors.danger,
})[variant]

const containerBySize: Record<Size, string> = {
  sm: 'h-9 px-3.5 rounded-lg gap-1.5',
  md: 'h-12 px-5 rounded-xl gap-2',
  lg: 'h-14 px-6 rounded-2xl gap-2.5',
}

const textBySize: Record<Size, string> = {
  sm: 'text-sm font-semibold',
  md: 'text-base font-semibold',
  lg: 'text-[17px] font-semibold',
}

const iconBySize: Record<Size, number> = { sm: 16, md: 18, lg: 20 }

export type ButtonProps = Omit<PressableProps, 'children'> & {
  label: string
  variant?: Variant
  size?: Size
  icon?: LucideIcon
  loading?: boolean
  fullWidth?: boolean
  haptic?: boolean
  className?: string
}

export function Button({
  label,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  loading = false,
  fullWidth = false,
  haptic = false,
  disabled,
  onPress,
  className,
  ...props
}: ButtonProps) {
  const colors = useThemeColors()
  const color = contentColor(variant, colors)
  const isDisabled = disabled || loading

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: loading }}
      disabled={isDisabled}
      onPress={event => {
        if (haptic) haptics.light()
        onPress?.(event)
      }}
      className={cn(
        'flex-row items-center justify-center active:opacity-80',
        containerByVariant[variant],
        containerBySize[size],
        fullWidth && 'self-stretch',
        isDisabled && 'opacity-50',
        className,
      )}
      {...props}
    >
      {loading ? (
        <ActivityIndicator size="small" color={color} />
      ) : (
        Icon && <Icon size={iconBySize[size]} color={color} strokeWidth={2.2} />
      )}
      <Text className={cn(textBySize[size], textByVariant[variant])} numberOfLines={1}>
        {label}
      </Text>
    </Pressable>
  )
}
