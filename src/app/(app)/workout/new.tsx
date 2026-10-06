import { router, useLocalSearchParams } from 'expo-router'
import { BookOpen, ChevronRight, KeyRound, PencilLine } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Callout, Chip, ChipRow, SegmentedControl } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { templateCategories, workoutTemplates, type WorkoutTemplate } from '@/data/content'
import { updateScheduledDays } from '@/data/streak'
import { cloneSharedWorkout, createWorkout, InvalidShareCodeError, WorkoutDayTakenError } from '@/data/workouts'
import { trackTemplateCloned, trackWorkoutCreated } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

type Mode = 'blank' | 'template' | 'code'
type Category = (typeof templateCategories)[number]['value'] | 'all'

const SUGGESTIONS = ['Peito e Tríceps', 'Costas e Bíceps', 'Pernas', 'Ombros e Abdômen', 'Full Body']

export default function NewWorkoutScreen() {
  const { day, ownerId } = useLocalSearchParams<{ day: string; ownerId?: string }>()
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()
  const userId = ownerId || profile.id

  const [mode, setMode] = useState<Mode>('blank')
  const [name, setName] = useState('')
  const [code, setCode] = useState('')
  const [category, setCategory] = useState<Category>('all')
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const finish = (message: string) => {
    haptics.success()
    toast.success(message)
    updateScheduledDays(userId)
    router.back()
  }

  const handleError = (err: unknown) => {
    setError(
      err instanceof WorkoutDayTakenError || err instanceof InvalidShareCodeError
        ? err.message
        : 'Não foi possível adicionar o treino. Verifique sua conexão e tente de novo.',
    )
    setBusy(null)
  }

  const createBlank = async () => {
    if (!name.trim()) {
      setError('Dê um nome ao treino, por exemplo "Peito e Tríceps".')
      return
    }
    setBusy('blank')
    setError(null)
    try {
      await createWorkout({ userId, createdBy: profile.id, day, name })
      trackWorkoutCreated(day)
      finish('Treino criado')
    } catch (err) {
      handleError(err)
    }
  }

  const cloneFromCode = async (shareCode: string, busyKey: string, template?: WorkoutTemplate) => {
    setBusy(busyKey)
    setError(null)
    try {
      await cloneSharedWorkout({ code: shareCode, userId, createdBy: profile.id, day })
      if (template) trackTemplateCloned(template.nome)
      finish(template ? 'Modelo adicionado' : 'Treino adicionado')
    } catch (err) {
      handleError(err)
    }
  }

  const templates = category === 'all' ? workoutTemplates : workoutTemplates.filter(template => template.categoria === category)

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      <View className="gap-1">
        <Text variant="overline" tone="subtle">{day}</Text>
        <Text tone="muted" className="text-sm">Escolha como quer montar o treino deste dia.</Text>
      </View>

      <SegmentedControl<Mode>
        value={mode}
        onChange={value => {
          setMode(value)
          setError(null)
        }}
        options={[
          { value: 'blank', label: 'Do zero', icon: PencilLine },
          { value: 'template', label: 'Modelo', icon: BookOpen },
          { value: 'code', label: 'Código', icon: KeyRound },
        ]}
      />

      {error && <Callout tone="danger">{error}</Callout>}

      {mode === 'blank' && (
        <View className="gap-4">
          <TextField label="Nome do treino" value={name} onChangeText={setName} placeholder="Ex.: Costas e Bíceps" autoFocus returnKeyType="done" onSubmitEditing={createBlank} maxLength={80} />
          <ChipRow>
            {SUGGESTIONS.map(suggestion => (
              <Chip key={suggestion} label={suggestion} selected={name === suggestion} onPress={() => setName(suggestion)} />
            ))}
          </ChipRow>
          <Button label="Criar treino" size="lg" loading={busy === 'blank'} onPress={createBlank} />
          <Text variant="caption" tone="subtle" className="text-center">Depois de criar, adicione os exercícios pelo botão + na tela de treino.</Text>
        </View>
      )}

      {mode === 'template' && (
        <View className="gap-4">
          <ChipRow>
            <Chip label="Todos" selected={category === 'all'} onPress={() => setCategory('all')} />
            {templateCategories.map(item => (
              <Chip key={item.value} label={item.label} selected={category === item.value} onPress={() => setCategory(item.value)} />
            ))}
          </ChipRow>
          <Card className="overflow-hidden">
            {templates.map((template, index) => (
              <View key={template.id}>
                {index > 0 && <View className="h-px bg-border mx-4" />}
                <Pressable
                  accessibilityRole="button"
                  disabled={!!busy}
                  onPress={() => cloneFromCode(template.id, template.id, template)}
                  className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-2"
                >
                  <View className="flex-1 gap-0.5">
                    <Text className="text-base font-semibold">{template.nome}</Text>
                    <Text variant="caption" tone="muted">{template.descricao}</Text>
                  </View>
                  {busy === template.id ? <Text variant="caption" tone="primary">Adicionando...</Text> : <ChevronRight size={18} color={colors.subtle} />}
                </Pressable>
              </View>
            ))}
          </Card>
        </View>
      )}

      {mode === 'code' && (
        <View className="gap-4">
          <TextField
            label="Código de compartilhamento"
            value={code}
            onChangeText={setCode}
            placeholder="Cole o código recebido"
            autoCapitalize="none"
            autoCorrect={false}
            hint="Peça para quem montou o treino tocar em Compartilhar no perfil dele."
          />
          <Button label="Adicionar treino" size="lg" loading={busy === 'code'} disabled={!code.trim()} onPress={() => cloneFromCode(code, 'code')} />
        </View>
      )}
    </ScreenScroll>
  )
}
