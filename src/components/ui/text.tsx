import { Text as RNText, type TextProps as RNTextProps } from 'react-native'
import { cn } from '@/lib/cn'

const variants = {
  display: 'text-[32px] leading-[38px] font-bold',
  title: 'text-2xl font-bold',
  heading: 'text-lg font-semibold',
  subheading: 'text-base font-semibold',
  body: 'text-base leading-6',
  label: 'text-sm font-medium',
  caption: 'text-xs',
  overline: 'text-xs font-semibold uppercase tracking-[0.6px]',
} as const

const tones = {
  default: 'text-foreground',
  muted: 'text-muted',
  subtle: 'text-subtle',
  primary: 'text-primary',
  danger: 'text-danger',
  success: 'text-success',
  warning: 'text-warning',
  'on-primary': 'text-on-primary',
} as const

export type TextVariant = keyof typeof variants
export type TextTone = keyof typeof tones

export type TextProps = RNTextProps & {
  variant?: TextVariant
  tone?: TextTone
  className?: string
}

export function Text({ variant = 'body', tone = 'default', className, ...props }: TextProps) {
  return <RNText className={cn(variants[variant], tones[tone], className)} {...props} />
}
