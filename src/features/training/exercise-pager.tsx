import { useCallback, useRef, useState } from 'react'
import { FlatList, useWindowDimensions, View, type ViewToken } from 'react-native'
import { cn } from '@/lib/cn'
import type { Exercicio } from '@/data/types'
import { ExerciseCard } from './exercise-card'

const GAP = 12
const VIEWABILITY = { itemVisiblePercentThreshold: 60 }

type ExercisePagerProps = {
  exercises: Exercicio[]
  workoutId: string
  userId: string
  readOnly: boolean
  playBeep: () => void
}

/**
 * Carrossel horizontal com um card por exercício.
 * Deve ser montado com key do treino: assim abre direto no primeiro exercício pendente.
 */
export function ExercisePager({ exercises, workoutId, userId, readOnly, playBeep }: ExercisePagerProps) {
  const { width: windowWidth } = useWindowDimensions()
  const [measuredWidth, setMeasuredWidth] = useState(0)
  const pageWidth = (measuredWidth || windowWidth) - 32
  const listRef = useRef<FlatList<Exercicio>>(null)

  const [initialIndex] = useState(() => Math.max(0, exercises.findIndex(exercise => !(exercise.isFeito || exercise.isSkipped))))
  const [page, setPage] = useState(initialIndex)

  const onViewableItemsChanged = useCallback(({ viewableItems }: { viewableItems: ViewToken<Exercicio>[] }) => {
    const first = viewableItems[0]
    if (first?.index != null) setPage(first.index)
  }, [])

  const goTo = (index: number) => {
    if (index < 0 || index >= exercises.length) return
    listRef.current?.scrollToIndex({ index, animated: true })
  }

  return (
    <View className="flex-1" onLayout={event => setMeasuredWidth(event.nativeEvent.layout.width)}>
      <FlatList
        ref={listRef}
        data={exercises}
        keyExtractor={item => item.id}
        horizontal
        snapToInterval={pageWidth + GAP}
        decelerationRate="fast"
        disableIntervalMomentum
        showsHorizontalScrollIndicator={false}
        initialScrollIndex={initialIndex < exercises.length ? initialIndex : 0}
        contentContainerStyle={{ paddingHorizontal: 16, gap: GAP, paddingBottom: 12 }}
        getItemLayout={(_, index) => ({ length: pageWidth + GAP, offset: (pageWidth + GAP) * index, index })}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={VIEWABILITY}
        onScrollToIndexFailed={() => {}}
        renderItem={({ item, index }) => (
          <View style={{ width: pageWidth }}>
            <ExerciseCard
              exercise={item}
              workoutId={workoutId}
              userId={userId}
              position={index + 1}
              total={exercises.length}
              readOnly={readOnly}
              playBeep={playBeep}
              onFinished={() => setTimeout(() => goTo(index + 1), 350)}
            />
          </View>
        )}
      />
      <View className="flex-row justify-center gap-1.5 pb-3" accessibilityLabel={`Exercício ${page + 1} de ${exercises.length}`}>
        {exercises.map((exercise, index) => (
          <View
            key={exercise.id}
            className={cn(
              'h-1.5 rounded-full',
              index === page ? 'w-5 bg-primary' : exercise.isFeito || exercise.isSkipped ? 'w-1.5 bg-primary/50' : 'w-1.5 bg-surface-3',
            )}
          />
        ))}
      </View>
    </View>
  )
}
