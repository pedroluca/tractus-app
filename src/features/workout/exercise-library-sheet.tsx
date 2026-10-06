import { Search, X } from 'lucide-react-native'
import { useMemo, useState } from 'react'
import { FlatList, Modal, Pressable, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Chip, ChipRow } from '@/components/ui/misc'
import { IconButton } from '@/components/ui/icon-button'
import { Text } from '@/components/ui/text'
import { exerciseLibrary, getMuscleGroups, type Exercise, type MuscleGroup } from '@/data/exercise-library'
import { normalizeText } from '@/data/week-days'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'

type Props = {
  visible: boolean
  onClose: () => void
  onSelect: (exercise: Exercise) => void
}

/** Biblioteca de exercícios em tela cheia, com busca (ignora acentos) e filtro por músculo */
export function ExerciseLibrarySheet({ visible, onClose, onSelect }: Props) {
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const [search, setSearch] = useState('')
  const [muscle, setMuscle] = useState<MuscleGroup | 'all'>('all')
  const muscleGroups = useMemo(() => getMuscleGroups(), [])

  const filtered = useMemo(() => {
    const term = normalizeText(search)
    return exerciseLibrary.filter(exercise => {
      const matchesMuscle = muscle === 'all' || exercise.musculos.includes(muscle)
      const matchesSearch = !term
        || normalizeText(exercise.nome).includes(term)
        || exercise.musculos.some(item => normalizeText(item).includes(term))
        || normalizeText(exercise.equipamento).includes(term)
      return matchesMuscle && matchesSearch
    })
  }, [search, muscle])

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent navigationBarTranslucent>
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="flex-row items-center gap-2 px-4 py-2">
          <Text variant="heading" className="flex-1">Biblioteca de exercícios</Text>
          <IconButton icon={X} accessibilityLabel="Fechar" variant="surface" onPress={onClose} />
        </View>

        <View className="px-4 pb-3 gap-3">
          <View className="flex-row items-center h-11 px-3.5 rounded-xl bg-surface-2 gap-2">
            <Search size={18} color={colors.subtle} />
            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar por nome, músculo ou equipamento"
              placeholderTextColor={colors.subtle}
              className="flex-1 text-base text-foreground"
              autoCorrect={false}
            />
          </View>
          <ChipRow>
            <Chip label="Todos" selected={muscle === 'all'} onPress={() => setMuscle('all')} />
            {muscleGroups.map(group => (
              <Chip key={group} label={group} selected={muscle === group} onPress={() => setMuscle(group)} />
            ))}
          </ChipRow>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ItemSeparatorComponent={() => <View className="h-px bg-border mx-4" />}
          ListEmptyComponent={<Text tone="muted" className="text-center py-10">Nenhum exercício encontrado.</Text>}
          renderItem={({ item }) => (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                haptics.selection()
                onSelect(item)
                onClose()
              }}
              className="px-4 py-3 gap-1 active:bg-surface-2"
            >
              <Text className="text-base font-semibold">{item.nome}</Text>
              <Text variant="caption" tone="muted">
                {item.musculos.join(', ')} · {item.equipamento} · {item.dificuldade}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  )
}
