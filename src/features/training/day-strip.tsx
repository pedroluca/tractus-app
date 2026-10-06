import { Pressable, View } from 'react-native'
import { WEEK_DAYS } from '@/data/week-days'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { Text } from '@/components/ui/text'

const SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

type DayStripProps = {
  selected: number
  onSelect: (index: number) => void
  daysWithWorkout: Set<string>
}

/** Semana inteira visível: o dia de hoje tem contorno e os dias com treino têm um ponto */
export function DayStrip({ selected, onSelect, daysWithWorkout }: DayStripProps) {
  const today = new Date().getDay()

  return (
    <View className="flex-row gap-1.5">
      {WEEK_DAYS.map((day, index) => {
        const isSelected = index === selected
        const isToday = index === today
        const hasWorkout = daysWithWorkout.has(day.toLowerCase())
        return (
          <Pressable
            key={day}
            accessibilityRole="tab"
            accessibilityLabel={`${day}${isToday ? ', hoje' : ''}${hasWorkout ? ', com treino' : ''}`}
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (!isSelected) haptics.selection()
              onSelect(index)
            }}
            className={cn(
              'flex-1 items-center justify-center gap-1 h-14 rounded-2xl border',
              isSelected ? 'bg-primary border-primary' : isToday ? 'bg-surface border-primary/60' : 'bg-surface border-border',
            )}
          >
            <Text className={cn('text-[13px] font-semibold', isSelected ? 'text-on-primary' : isToday ? 'text-primary' : 'text-foreground')}>
              {SHORT[index]}
            </Text>
            <View className={cn('w-1.5 h-1.5 rounded-full', hasWorkout ? (isSelected ? 'bg-on-primary' : 'bg-primary') : 'bg-transparent')} />
          </Pressable>
        )
      })}
    </View>
  )
}
