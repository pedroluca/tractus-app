import type { LucideIcon } from 'lucide-react-native'
import { Pressable, type PressableProps, View } from 'react-native'
import { cn } from '@/lib/cn'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

type Variant = 'ghost' | 'surface' | 'primary' | 'soft'

export type IconButtonProps = Omit<PressableProps, 'children'> & {
  icon: LucideIcon
  accessibilityLabel: string
  variant?: Variant
  size?: number
  iconSize?: number
  color?: string
  badge?: number
  className?: string
}

const containerByVariant: Record<Variant, string> = {
  ghost: 'bg-transparent active:bg-surface-2',
  surface: 'bg-surface-2 active:bg-surface-3',
  primary: 'bg-primary active:opacity-80',
  soft: 'bg-primary/10 active:bg-primary/20',
}

export function IconButton({
  icon: Icon,
  variant = 'ghost',
  size = 40,
  iconSize = 20,
  color,
  badge,
  disabled,
  className,
  ...props
}: IconButtonProps) {
  const colors = useThemeColors()
  const iconColor = color ?? (variant === 'primary' ? colors.onPrimary : variant === 'soft' ? colors.primary : colors.foreground)

  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={6}
      disabled={disabled}
      style={{ width: size, height: size }}
      className={cn('items-center justify-center rounded-full', containerByVariant[variant], disabled && 'opacity-40', className)}
      {...props}
    >
      <Icon size={iconSize} color={iconColor} strokeWidth={2} />
      {!!badge && badge > 0 && (
        <View className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger items-center justify-center">
          <Text className="text-[10px] leading-3 font-bold text-white">{badge > 9 ? '9+' : badge}</Text>
        </View>
      )}
    </Pressable>
  )
}
