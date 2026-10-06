import { Eye, EyeOff } from 'lucide-react-native'
import { forwardRef, useState } from 'react'
import { Pressable, TextInput, View, type TextInputProps } from 'react-native'
import { cn } from '@/lib/cn'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

export type TextFieldProps = TextInputProps & {
  label?: string
  hint?: string
  error?: string | null
  prefix?: string
  secureToggle?: boolean
  containerClassName?: string
}

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, hint, error, prefix, secureToggle, secureTextEntry, multiline, containerClassName, className, onFocus, onBlur, ...props },
  ref,
) {
  const colors = useThemeColors()
  const [focused, setFocused] = useState(false)
  const [hidden, setHidden] = useState(true)
  const isSecure = secureToggle ? hidden : secureTextEntry

  return (
    <View className={cn('gap-1.5', containerClassName)}>
      {label && <Text variant="label" tone="muted">{label}</Text>}
      <View
        className={cn(
          'flex-row items-center rounded-xl bg-surface-2 border',
          focused ? 'border-primary' : 'border-transparent',
          error && 'border-danger',
          multiline ? 'min-h-24 items-start py-2' : 'h-12',
        )}
      >
        {prefix && <Text tone="subtle" className="pl-4">{prefix}</Text>}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.subtle}
          selectionColor={colors.primary}
          cursorColor={colors.primary}
          secureTextEntry={isSecure}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          className={cn('flex-1 text-base text-foreground', prefix ? 'pl-1 pr-4' : 'px-4', multiline && 'py-1', className)}
          onFocus={event => {
            setFocused(true)
            onFocus?.(event)
          }}
          onBlur={event => {
            setFocused(false)
            onBlur?.(event)
          }}
          {...props}
        />
        {secureToggle && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={hidden ? 'Mostrar senha' : 'Ocultar senha'}
            onPress={() => setHidden(value => !value)}
            hitSlop={8}
            className="px-4 h-full justify-center"
          >
            {hidden ? <Eye size={20} color={colors.subtle} /> : <EyeOff size={20} color={colors.subtle} />}
          </Pressable>
        )}
      </View>
      {error ? (
        <Text variant="caption" tone="danger">{error}</Text>
      ) : hint ? (
        <Text variant="caption" tone="subtle">{hint}</Text>
      ) : null}
    </View>
  )
})
