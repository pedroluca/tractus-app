import { Flame } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, View } from 'react-native'
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'
import type { StreakUpdateResult } from '@/data/streak'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'

const HEADLINES = ['Mandou bem!', 'Treino concluído!', 'Arrasou!', 'Mais um pra conta!']

type Props = {
  visible: boolean
  workoutName: string
  /** null enquanto a streak ainda está sendo atualizada */
  result: StreakUpdateResult | null
  onClose: () => void
}

export function WorkoutCompleteDialog({ visible, workoutName, result, onClose }: Props) {
  const colors = useThemeColors()
  const [headline] = useState(() => HEADLINES[Math.floor(Math.random() * HEADLINES.length)])
  const [revealed, setRevealed] = useState(false)
  const scale = useSharedValue(1)

  // Quando a semana entra na sequência, mostra o valor anterior e "sobe" para o novo
  const animateIncrement = !!result?.streakIncremented
  useEffect(() => {
    if (!visible || !animateIncrement) return
    const timer = setTimeout(() => {
      setRevealed(true)
      haptics.success()
      scale.value = withSequence(withSpring(1.25, { damping: 8 }), withTiming(1, { duration: 220 }))
    }, 650)
    return () => clearTimeout(timer)
  }, [visible, animateIncrement, scale])

  const displayStreak = !result
    ? null
    : animateIncrement && !revealed ? Math.max(0, result.currentStreak - 1) : result.currentStreak

  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Dialog visible={visible} onClose={onClose} animation="pop">
      <View className="items-center gap-4 pt-2">
        <View className="items-center">
          {/* Só o círculo pulsa: escalar o bloco inteiro estourava o padding do topo */}
          <Animated.View
            style={[flameStyle, { backgroundColor: `${colors.streak}1F` }]}
            className="w-20 h-20 rounded-full items-center justify-center"
          >
            <Flame size={40} color={colors.streak} fill={colors.streak} />
          </Animated.View>
          <View className="h-9 justify-center mt-2">
            {displayStreak === null ? (
              <ActivityIndicator color={colors.streak} />
            ) : (
              <Text className="text-3xl font-bold text-streak tabular-nums">
                {displayStreak} {displayStreak === 1 ? 'semana' : 'semanas'}
              </Text>
            )}
          </View>
        </View>

        <View className="items-center gap-1">
          <Text variant="title" className="text-center">{headline}</Text>
          <Text tone="muted" className="text-center text-sm">Você completou todos os exercícios de</Text>
          <Text className="text-base font-semibold text-center">{workoutName}</Text>
          {!!result?.totalWorkouts && (
            <Text tone="subtle" className="text-xs mt-0.5">Treino nº {result.totalWorkouts}</Text>
          )}
        </View>

        {result && (
          <View className="bg-surface-2 rounded-2xl px-4 py-3 self-stretch">
            <Text className="text-sm text-center font-medium">
              {result.streakIncremented ? 'Mais uma semana na sequência.' : 'Semana já garantida na sua sequência.'}
            </Text>
          </View>
        )}

        <Button label="Fechar" onPress={onClose} className="self-stretch" />
      </View>
    </Dialog>
  )
}
