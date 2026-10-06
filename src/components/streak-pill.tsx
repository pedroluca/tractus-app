import { router } from 'expo-router'
import { Flame } from 'lucide-react-native'
import { Pressable } from 'react-native'
import { getWeekKey } from '@/data/streak'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'
import { Text } from './ui/text'

/** Contador de semanas seguidas. Fica laranja quando a semana atual já foi garantida */
export function StreakPill() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const trainedThisWeek = profile.lastStreakWeek === getWeekKey()
  const streak = profile.currentStreak ?? 0

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Streak de ${streak} semanas${trainedThisWeek ? ', semana garantida' : ''}`}
      onPress={() => router.push(profile.isPremium ? '/profile/streak-calendar' : '/profile')}
      className={cn('flex-row items-center gap-1.5 h-9 pl-2.5 pr-3 rounded-full', trainedThisWeek ? 'bg-streak/15' : 'bg-surface-2')}
    >
      <Flame size={18} color={trainedThisWeek ? colors.streak : colors.subtle} fill={trainedThisWeek ? colors.streak : 'transparent'} />
      <Text className={cn('text-base font-bold', trainedThisWeek ? 'text-streak' : 'text-muted')}>{streak}</Text>
    </Pressable>
  )
}
