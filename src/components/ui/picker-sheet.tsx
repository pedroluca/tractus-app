import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker'
import { Calendar, Check, ChevronDown } from 'lucide-react-native'
import { useState } from 'react'
import { Platform, Pressable, View } from 'react-native'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'
import { Button } from './button'
import { Sheet } from './sheet'
import { Text } from './text'

type Option<T extends string> = { value: T; label: string; description?: string }

/** Campo de seleção que abre uma lista em folha (substitui o <select> do web) */
export function SelectField<T extends string>({ label, value, options, onChange, placeholder = 'Selecionar', sheetTitle }: {
  label?: string
  value: T | null
  options: Option<T>[]
  onChange: (value: T) => void
  placeholder?: string
  sheetTitle?: string
}) {
  const colors = useThemeColors()
  const [open, setOpen] = useState(false)
  const selected = options.find(option => option.value === value)

  return (
    <View className="gap-1.5">
      {label && <Text variant="label" tone="muted">{label}</Text>}
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        className="flex-row items-center h-12 px-4 rounded-xl bg-surface-2 active:bg-surface-3"
      >
        <Text className={cn('flex-1 text-base', !selected && 'text-subtle')} numberOfLines={1}>{selected?.label ?? placeholder}</Text>
        <ChevronDown size={18} color={colors.subtle} />
      </Pressable>
      <Sheet visible={open} onClose={() => setOpen(false)} title={sheetTitle ?? label} scrollable>
        {options.map(option => {
          const isSelected = option.value === value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => {
                haptics.selection()
                onChange(option.value)
                setOpen(false)
              }}
              className="flex-row items-center gap-3 py-3.5 px-1 rounded-xl active:bg-surface-2"
            >
              <View className="flex-1">
                <Text className={cn('text-base', isSelected && 'font-semibold text-primary')}>{option.label}</Text>
                {option.description && <Text variant="caption" tone="muted">{option.description}</Text>}
              </View>
              {isSelected && <Check size={18} color={colors.primary} />}
            </Pressable>
          )
        })}
      </Sheet>
    </View>
  )
}

/** Campo de data com o seletor nativo de cada plataforma */
export function DateField({ label, value, onChange, maximumDate, minimumDate, placeholder = 'Selecionar data' }: {
  label?: string
  value: Date | null
  onChange: (date: Date) => void
  maximumDate?: Date
  minimumDate?: Date
  placeholder?: string
}) {
  const colors = useThemeColors()
  const [iosOpen, setIosOpen] = useState(false)
  const [draft, setDraft] = useState<Date>(value ?? new Date())

  const open = () => {
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value: value ?? new Date(2000, 0, 1),
        mode: 'date',
        maximumDate,
        minimumDate,
        onChange: (event, date) => {
          if (event.type === 'set' && date) onChange(date)
        },
      })
      return
    }
    setDraft(value ?? new Date(2000, 0, 1))
    setIosOpen(true)
  }

  return (
    <View className="gap-1.5">
      {label && <Text variant="label" tone="muted">{label}</Text>}
      <Pressable accessibilityRole="button" onPress={open} className="flex-row items-center h-12 px-4 rounded-xl bg-surface-2 active:bg-surface-3">
        <Text className={cn('flex-1 text-base', !value && 'text-subtle')}>
          {value ? value.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' }) : placeholder}
        </Text>
        <Calendar size={18} color={colors.subtle} />
      </Pressable>
      {Platform.OS === 'ios' && (
        <Sheet visible={iosOpen} onClose={() => setIosOpen(false)} title={label}>
          <DateTimePicker value={draft} mode="date" display="spinner" maximumDate={maximumDate} minimumDate={minimumDate} onChange={(_, date) => date && setDraft(date)} locale="pt-BR" />
          <Button label="Confirmar" onPress={() => { onChange(draft); setIosOpen(false) }} className="mt-2" />
        </Sheet>
      )}
    </View>
  )
}
