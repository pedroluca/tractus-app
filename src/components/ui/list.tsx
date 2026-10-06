import { ChevronRight, type LucideIcon } from 'lucide-react-native'
import { Children, Fragment, isValidElement, type ReactNode } from 'react'
import { Pressable, Switch, View } from 'react-native'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

type SectionProps = {
  title?: string
  footer?: string
  children: ReactNode
  className?: string
}

/** Grupo de linhas no estilo das configurações nativas (cartão com divisórias) */
export function ListSection({ title, footer, children, className }: SectionProps) {
  const items = Children.toArray(children).filter(isValidElement)
  return (
    <View className={cn('gap-2', className)}>
      {title && <Text variant="overline" tone="subtle" className="px-1">{title}</Text>}
      <View className="bg-surface rounded-2xl border border-border overflow-hidden">
        {items.map((child, index) => (
          <Fragment key={child.key ?? index}>
            {index > 0 && <View className="h-px bg-border ml-14" />}
            {child}
          </Fragment>
        ))}
      </View>
      {footer && <Text variant="caption" tone="subtle" className="px-1">{footer}</Text>}
    </View>
  )
}

type RowProps = {
  title: string
  description?: string
  icon?: LucideIcon
  iconColor?: string
  value?: string
  onPress?: () => void
  accessory?: ReactNode
  showChevron?: boolean
  destructive?: boolean
  disabled?: boolean
}

export function ListRow({ title, description, icon: Icon, iconColor, value, onPress, accessory, showChevron, destructive, disabled }: RowProps) {
  const colors = useThemeColors()
  const tint = destructive ? colors.danger : iconColor ?? colors.primary
  const chevron = showChevron ?? (!!onPress && !accessory)

  return (
    <Pressable
      disabled={!onPress || disabled}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('flex-row items-center gap-3 px-4 py-3.5 min-h-14', onPress && 'active:bg-surface-2', disabled && 'opacity-50')}
    >
      {Icon && (
        <View className="w-8 h-8 rounded-lg items-center justify-center" style={{ backgroundColor: `${tint}1F` }}>
          <Icon size={18} color={tint} strokeWidth={2.2} />
        </View>
      )}
      <View className="flex-1 gap-0.5">
        <Text className={cn('text-base', destructive ? 'text-danger font-medium' : 'text-foreground')}>{title}</Text>
        {description && <Text variant="caption" tone="muted" className="leading-4">{description}</Text>}
      </View>
      {value && <Text tone="subtle" className="text-sm">{value}</Text>}
      {accessory}
      {chevron && <ChevronRight size={18} color={colors.subtle} />}
    </Pressable>
  )
}

type SwitchRowProps = Omit<RowProps, 'onPress' | 'accessory' | 'value'> & {
  value: boolean
  onValueChange: (value: boolean) => void
}

export function SwitchRow({ value, onValueChange, disabled, ...props }: SwitchRowProps) {
  const toggle = (next: boolean) => {
    haptics.selection()
    onValueChange(next)
  }
  return (
    <ListRow
      {...props}
      disabled={disabled}
      showChevron={false}
      onPress={() => toggle(!value)}
      accessory={<AppSwitch value={value} onValueChange={toggle} disabled={disabled} />}
    />
  )
}

export function AppSwitch({ value, onValueChange, disabled }: { value: boolean; onValueChange: (value: boolean) => void; disabled?: boolean }) {
  const colors = useThemeColors()
  return (
    <Switch
      value={value}
      onValueChange={onValueChange}
      disabled={disabled}
      trackColor={{ true: colors.primary, false: colors.surface3 }}
      thumbColor="#ffffff"
      ios_backgroundColor={colors.surface3}
    />
  )
}
