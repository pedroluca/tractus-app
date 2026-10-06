import { BookOpen, Trash2 } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppSwitch } from '@/components/ui/list'
import { ScreenScroll } from '@/components/ui/screen'
import { StepperField } from '@/components/ui/stepper-field'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import type { Exercise } from '@/data/exercise-library'
import type { ProgressiveSet } from '@/data/types'
import type { ExerciseInput } from '@/data/workouts'
import { formatRest } from '@/lib/dates'
import { ExerciseLibrarySheet } from './exercise-library-sheet'

type ExerciseFormProps = {
  initial?: ExerciseInput
  submitLabel: string
  onSubmit: (input: ExerciseInput) => Promise<void> | void
  onDelete?: () => void
  showLibrary?: boolean
}

const DEFAULTS: ExerciseInput = {
  titulo: '',
  series: 3,
  repeticoes: 12,
  peso: 0,
  tempoIntervalo: 90,
  usesProgressiveWeight: false,
}

/** Ajusta a lista de séries progressivas ao número de séries, copiando a última */
function resizeSets(sets: ProgressiveSet[], count: number, fallback: ProgressiveSet): ProgressiveSet[] {
  if (sets.length === count) return sets
  if (sets.length > count) return sets.slice(0, count)
  const last = sets.at(-1) ?? fallback
  return [...sets, ...Array.from({ length: count - sets.length }, () => ({ ...last }))]
}

export function ExerciseForm({ initial, submitLabel, onSubmit, onDelete, showLibrary }: ExerciseFormProps) {
  const start = initial ?? DEFAULTS
  const [titulo, setTitulo] = useState(start.titulo)
  const [series, setSeries] = useState(start.series || 3)
  const [repeticoes, setRepeticoes] = useState(start.repeticoes)
  const [peso, setPeso] = useState(start.peso)
  const [descanso, setDescanso] = useState(start.tempoIntervalo)
  const [progressive, setProgressive] = useState(start.usesProgressiveWeight)
  const [sets, setSets] = useState<ProgressiveSet[]>(
    start.progressiveSets?.length ? start.progressiveSets : resizeSets([], start.series || 3, { reps: start.repeticoes || 10, weight: start.peso }),
  )
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const changeSeries = (value: number) => {
    setSeries(value)
    setSets(current => resizeSets(current, value, { reps: repeticoes || 10, weight: peso }))
  }

  const updateSet = (index: number, patch: Partial<ProgressiveSet>) => {
    setSets(current => current.map((set, setIndex) => (setIndex === index ? { ...set, ...patch } : set)))
  }

  const applyLibrary = (exercise: Exercise) => {
    setTitulo(exercise.nome)
    // Sugestão inicial pelo nível do exercício (mesma regra do web)
    const preset = exercise.dificuldade === 'Iniciante' ? { s: 3, r: 12 } : exercise.dificuldade === 'Intermediário' ? { s: 4, r: 10 } : { s: 4, r: 8 }
    changeSeries(preset.s)
    setRepeticoes(preset.r)
    setDescanso(90)
  }

  const submit = async () => {
    if (!titulo.trim()) {
      setError('Dê um nome ao exercício.')
      return
    }
    setError(null)
    setSaving(true)
    try {
      const finalSets = resizeSets(sets, series, { reps: repeticoes || 10, weight: peso })
      await onSubmit({
        titulo: titulo.trim(),
        series,
        repeticoes: progressive ? finalSets[0]?.reps ?? repeticoes : repeticoes,
        peso: progressive ? finalSets[0]?.weight ?? peso : peso,
        tempoIntervalo: descanso,
        usesProgressiveWeight: progressive,
        progressiveSets: progressive ? finalSets : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      {showLibrary && (
        <Button label="Escolher da biblioteca" icon={BookOpen} variant="secondary" onPress={() => setLibraryOpen(true)} />
      )}

      <TextField label="Nome do exercício" value={titulo} onChangeText={setTitulo} placeholder="Ex.: Supino inclinado com halteres" maxLength={120} error={error} />

      <StepperField label="Séries" value={series} onChange={changeSeries} min={1} max={20} />

      <Card className="px-4 py-3.5 flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <Text className="text-base font-medium">Progressão de carga</Text>
          <Text variant="caption" tone="muted">Repetições e carga diferentes em cada série</Text>
        </View>
        <AppSwitch value={progressive} onValueChange={setProgressive} />
      </Card>

      {progressive ? (
        <View className="gap-3">
          {sets.slice(0, series).map((set, index) => (
            <View key={index} className="gap-1.5">
              <Text variant="label" tone="muted">Série {index + 1}</Text>
              <View className="flex-row gap-2">
                <StepperField className="flex-1" value={set.reps} onChange={reps => updateSet(index, { reps })} min={0} max={200} suffix="reps" compact />
                <StepperField className="flex-1" value={set.weight} onChange={weight => updateSet(index, { weight })} min={0} max={2000} decimals={1} suffix="kg" compact />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <>
          <StepperField label="Repetições" value={repeticoes} onChange={setRepeticoes} min={0} max={200} />
          <StepperField label="Carga" value={peso} onChange={setPeso} min={0} max={2000} decimals={1} suffix="kg" />
        </>
      )}

      <View className="gap-1.5">
        <StepperField label="Descanso entre séries" value={descanso} onChange={setDescanso} step={15} min={0} max={3600} suffix="s" />
        <Text variant="caption" tone="subtle">{descanso > 0 ? `${formatRest(descanso)} de descanso` : 'Sem descanso: a série conta assim que você concluir'}</Text>
      </View>

      <View className="flex-row gap-2">
        {onDelete && <Button label="Excluir" icon={Trash2} variant="danger-soft" size="lg" onPress={onDelete} />}
        <Button label={submitLabel} size="lg" className="flex-1" loading={saving} onPress={submit} />
      </View>

      {showLibrary && <ExerciseLibrarySheet visible={libraryOpen} onClose={() => setLibraryOpen(false)} onSelect={applyLibrary} />}
    </ScreenScroll>
  )
}
