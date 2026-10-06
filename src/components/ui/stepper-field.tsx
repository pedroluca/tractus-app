import { Minus, Plus } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, TextInput, View } from 'react-native'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

type StepperFieldProps = {
  label?: string
  value: number
  onChange: (value: number) => void
  step?: number
  min?: number
  max?: number
  /** Casas decimais aceitas (0 = só inteiros) */
  decimals?: number
  suffix?: string
  compact?: boolean
  className?: string
}

const format = (value: number, decimals: number) =>
  decimals > 0 ? String(Number(value.toFixed(decimals))).replace('.', ',') : String(Math.round(value))

/** Campo numérico com botões − e +, aceitando digitação com vírgula ou ponto */
export function StepperField({
  label,
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  decimals = 0,
  suffix,
  compact = false,
  className,
}: StepperFieldProps) {
  const colors = useThemeColors()
  // Rascunho só existe enquanto o campo está em foco; fora dele mostra sempre o valor real
  const [draft, setDraft] = useState<string | null>(null)
  const text = draft ?? format(value, decimals)

  const clamp = (next: number) => Math.min(max, Math.max(min, Number(next.toFixed(decimals))))

  const nudge = (direction: 1 | -1) => {
    haptics.selection()
    onChange(clamp(value + direction * step))
  }

  const commit = (raw: string) => {
    const parsed = Number(raw.replace(',', '.'))
    if (raw.trim() !== '' && !Number.isNaN(parsed)) onChange(clamp(parsed))
  }

  const buttonClass = cn('items-center justify-center rounded-xl bg-surface-2 active:bg-surface-3', compact ? 'w-10 h-10' : 'w-12 h-12')

  return (
    <View className={cn('gap-1.5', className)}>
      {label && <Text variant="label" tone="muted">{label}</Text>}
      <View className="flex-row items-center gap-2">
        <Pressable accessibilityRole="button" accessibilityLabel={`Diminuir ${label ?? ''}`} onPress={() => nudge(-1)} disabled={value <= min} className={cn(buttonClass, value <= min && 'opacity-40')}>
          <Minus size={18} color={colors.foreground} />
        </Pressable>
        <View className={cn('flex-1 flex-row items-center justify-center rounded-xl bg-surface-2 border', draft !== null ? 'border-primary' : 'border-transparent', compact ? 'h-10' : 'h-12')}>
          <TextInput
            value={text}
            onChangeText={setDraft}
            onFocus={() => setDraft(format(value, decimals))}
            onBlur={() => {
              commit(text)
              setDraft(null)
            }}
            onSubmitEditing={() => commit(text)}
            keyboardType={decimals > 0 ? 'decimal-pad' : 'number-pad'}
            selectTextOnFocus
            selectionColor={colors.primary}
            cursorColor={colors.primary}
            className="min-w-12 text-center text-base font-semibold text-foreground"
            accessibilityLabel={label}
          />
          {suffix && <Text tone="subtle" className="text-sm">{suffix}</Text>}
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel={`Aumentar ${label ?? ''}`} onPress={() => nudge(1)} disabled={value >= max} className={cn(buttonClass, value >= max && 'opacity-40')}>
          <Plus size={18} color={colors.foreground} />
        </Pressable>
      </View>
    </View>
  )
}
