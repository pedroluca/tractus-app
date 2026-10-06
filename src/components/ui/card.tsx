import { Pressable, View, type PressableProps, type ViewProps } from 'react-native'
import { cn } from '@/lib/cn'

export function Card({ className, ...props }: ViewProps & { className?: string }) {
  return <View className={cn('bg-surface rounded-2xl border border-border', className)} {...props} />
}

export function PressableCard({ className, ...props }: PressableProps & { className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      className={cn('bg-surface rounded-2xl border border-border active:bg-surface-2', className)}
      {...props}
    />
  )
}
