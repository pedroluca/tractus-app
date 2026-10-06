import * as Clipboard from 'expo-clipboard'
import * as DocumentPicker from 'expo-document-picker'
import { router } from 'expo-router'
import { Check, ChevronDown, CircleCheck, ClipboardPaste, FileDown, FileUp, TriangleAlert } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Callout } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import type { Treino } from '@/data/types'
import type { WeekDay } from '@/data/week-days'
import { formatDecimal, formatRestTime } from '@/data/workout-csv'
import {
  importWorkouts,
  JSON_EXAMPLE,
  parseWorkoutImport,
  readImportFile,
  shareCsvTemplate,
  type ImportResult,
  type ParsedExercise,
  type ParsedWorkout,
} from '@/data/workout-transfer'
import { getUserWorkouts } from '@/data/workouts'
import { cn } from '@/lib/cn'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

type Step = 'input' | 'preview' | 'result'
const MAX_VISIBLE_ERRORS = 8

function describeExercise(exercise: ParsedExercise): string {
  const rest = `descanso ${formatRestTime(exercise.tempoIntervalo)}`
  if (exercise.usesProgressiveWeight && exercise.progressiveSets) {
    return `${exercise.series} séries: ${exercise.progressiveSets.map(set => `${set.reps}×${formatDecimal(set.weight)}`).join(' · ')} kg · ${rest}`
  }
  const weight = exercise.peso > 0 ? ` · ${formatDecimal(exercise.peso)} kg` : ''
  return `${exercise.series} × ${exercise.repeticoes}${weight} · ${rest}`
}

export default function ImportWorkoutsScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()

  const [step, setStep] = useState<Step>('input')
  const [text, setText] = useState('')
  const [fileName, setFileName] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [warnings, setWarnings] = useState<string[]>([])
  const [workouts, setWorkouts] = useState<ParsedWorkout[]>([])
  const [selected, setSelected] = useState<Set<WeekDay>>(new Set())
  const [expanded, setExpanded] = useState<Set<WeekDay>>(new Set())
  const [existing, setExisting] = useState<Treino[]>([])
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showFormats, setShowFormats] = useState(false)

  useEffect(() => {
    getUserWorkouts(profile.id).then(setExisting).catch(() => {})
  }, [profile.id])

  const existingByDay = useMemo(() => new Map(existing.map(workout => [workout.dia, workout])), [existing])
  const selectedCount = workouts.filter(workout => selected.has(workout.dia)).length
  const replaceCount = workouts.filter(workout => selected.has(workout.dia) && existingByDay.has(workout.dia)).length

  const parse = (content: string) => {
    const parsed = parseWorkoutImport(content)
    if (!parsed.ok) {
      setErrors(parsed.errors)
      haptics.error()
      return
    }
    setErrors([])
    setWorkouts(parsed.treinos)
    setWarnings(parsed.warnings)
    // Dias que já têm treino começam desmarcados: substituir precisa ser escolha explícita
    setSelected(new Set(parsed.treinos.filter(workout => !existingByDay.has(workout.dia)).map(workout => workout.dia)))
    setExpanded(new Set())
    setStep('preview')
  }

  const pickFile = async () => {
    const picked = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/csv', 'text/comma-separated-values', 'text/plain', 'text/tab-separated-values', '*/*'],
      copyToCacheDirectory: true,
    })
    if (picked.canceled || !picked.assets[0]) return
    const asset = picked.assets[0]
    try {
      setFileName(asset.name)
      parse(await readImportFile(asset.uri, asset.size))
    } catch (error) {
      setErrors([error instanceof Error && error.message.includes('1 MB') ? error.message : 'Não foi possível ler o arquivo.'])
    }
  }

  const toggle = (set: Set<WeekDay>, day: WeekDay) => {
    const next = new Set(set)
    if (next.has(day)) next.delete(day)
    else next.add(day)
    return next
  }

  const runImport = async () => {
    const toImport = workouts.filter(workout => selected.has(workout.dia))
    if (toImport.length === 0) return
    setImporting(true)
    try {
      const importResult = await importWorkouts(profile.id, toImport)
      if (importResult.failed.length === 0) {
        haptics.success()
        toast.success(`${importResult.imported.length} ${importResult.imported.length === 1 ? 'treino importado' : 'treinos importados'}`)
        router.back()
        return
      }
      setResult(importResult)
      setStep('result')
    } catch {
      setErrors(['Erro ao importar os treinos. Verifique sua conexão e tente novamente.'])
    } finally {
      setImporting(false)
    }
  }

  const errorBox = errors.length > 0 && (
    <Callout tone="danger" icon={TriangleAlert} title={errors.length === 1 ? 'Encontramos um problema' : `Encontramos ${errors.length} problemas`}>
      <View className="gap-1">
        {errors.slice(0, MAX_VISIBLE_ERRORS).map((error, index) => <Text key={index} tone="muted" className="text-sm leading-5">• {error}</Text>)}
        {errors.length > MAX_VISIBLE_ERRORS && <Text tone="muted" className="text-xs">e mais {errors.length - MAX_VISIBLE_ERRORS}.</Text>}
      </View>
    </Callout>
  )

  if (step === 'result' && result) {
    return (
      <ScreenScroll contentClassName="pt-4 gap-4">
        {result.imported.length > 0 && (
          <Card className="p-4 gap-2">
            <Text variant="subheading">Importados</Text>
            {result.imported.map(day => (
              <View key={day} className="flex-row items-center gap-2">
                <CircleCheck size={16} color={colors.success} />
                <Text className="text-sm">{day}</Text>
              </View>
            ))}
          </Card>
        )}
        <Card className="p-4 gap-2">
          <Text variant="subheading">Não importados</Text>
          {result.failed.map(({ dia, message }) => (
            <View key={dia} className="flex-row items-start gap-2">
              <TriangleAlert size={16} color={colors.danger} style={{ marginTop: 2 }} />
              <Text className="text-sm flex-1"><Text className="text-sm font-semibold">{dia}:</Text> {message}</Text>
            </View>
          ))}
        </Card>
        <Button label="Fechar" size="lg" onPress={() => router.back()} />
      </ScreenScroll>
    )
  }

  if (step === 'preview') {
    return (
      <ScreenScroll contentClassName="pt-4 gap-4">
        <Text tone="muted" className="text-sm">Marque os dias que deseja importar. Toque no treino para ver os exercícios.</Text>
        {errorBox}
        {warnings.length > 0 && (
          <Callout tone="warning" title="Ajustes feitos na leitura">
            <View className="gap-1">
              {warnings.map((warning, index) => <Text key={index} tone="muted" className="text-xs leading-4">• {warning}</Text>)}
            </View>
          </Callout>
        )}

        {workouts.map(workout => {
          const isSelected = selected.has(workout.dia)
          const isExpanded = expanded.has(workout.dia)
          const current = existingByDay.get(workout.dia)
          return (
            <Card key={workout.dia} className={cn('overflow-hidden', isSelected && 'border-primary')}>
              <View className="flex-row items-center gap-3 p-4">
                <Pressable
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  accessibilityLabel={`Importar treino de ${workout.dia}`}
                  disabled={importing}
                  onPress={() => {
                    haptics.selection()
                    setSelected(set => toggle(set, workout.dia))
                  }}
                  hitSlop={8}
                  className={cn('w-6 h-6 rounded-md border-2 items-center justify-center', isSelected ? 'bg-primary border-primary' : 'border-border')}
                >
                  {isSelected && <Check size={16} color={colors.onPrimary} strokeWidth={3} />}
                </Pressable>
                <Pressable className="flex-1 flex-row items-center gap-2" onPress={() => setExpanded(set => toggle(set, workout.dia))}>
                  <View className="flex-1 gap-0.5">
                    <Text variant="caption" tone="muted">{workout.dia}</Text>
                    <Text className={cn('text-base font-semibold', !isSelected && 'text-muted')} numberOfLines={1}>{workout.musculo}</Text>
                    <Text variant="caption" tone="subtle">{workout.exercicios.length} {workout.exercicios.length === 1 ? 'exercício' : 'exercícios'}</Text>
                  </View>
                  <ChevronDown size={18} color={colors.subtle} style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }} />
                </Pressable>
              </View>
              {current && (
                <View className="mx-4 mb-3 rounded-xl px-3 py-2 bg-warning/10">
                  <Text className="text-xs text-warning">
                    {isSelected ? `Vai substituir o treino atual: ${current.musculo}` : `Você já tem "${current.musculo}" neste dia. Marque para substituir.`}
                  </Text>
                </View>
              )}
              {isExpanded && (
                <View className="border-t border-border px-4 py-3 gap-2.5">
                  {workout.exercicios.length === 0 && <Text variant="caption" tone="muted">Nenhum exercício neste treino.</Text>}
                  {workout.exercicios.map((exercise, index) => (
                    <View key={index} className="gap-0.5">
                      <Text className="text-sm font-semibold">{index + 1}. {exercise.titulo}</Text>
                      <Text variant="caption" tone="muted">{describeExercise(exercise)}</Text>
                      {!!exercise.nota && <Text variant="caption" tone="subtle" className="italic">{exercise.nota}</Text>}
                    </View>
                  ))}
                </View>
              )}
            </Card>
          )
        })}

        <View className="gap-2">
          <Button
            label={importing ? 'Importando...' : `Importar ${selectedCount} ${selectedCount === 1 ? 'treino' : 'treinos'}`}
            size="lg"
            loading={importing}
            disabled={selectedCount === 0}
            onPress={runImport}
          />
          {replaceCount > 0 && (
            <Text variant="caption" className="text-center text-warning">
              {replaceCount === 1 ? '1 treino existente será substituído' : `${replaceCount} treinos existentes serão substituídos`}
            </Text>
          )}
          <Button label="Voltar" variant="ghost" disabled={importing} onPress={() => { setErrors([]); setStep('input') }} />
        </View>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      <Text tone="muted" className="text-sm leading-5">Traga treinos de um arquivo JSON ou de uma planilha (CSV). Você revisa tudo antes de salvar.</Text>

      <Pressable onPress={pickFile} className="rounded-2xl border border-dashed border-border py-6 items-center gap-1.5 active:bg-surface-2">
        <FileUp size={26} color={colors.muted} />
        <Text className="text-base font-semibold">Selecionar arquivo</Text>
        <Text variant="caption" tone="muted">{fileName ?? '.json ou .csv'}</Text>
      </Pressable>

      <View className="flex-row items-center gap-3">
        <View className="flex-1 h-px bg-border" />
        <Text variant="caption" tone="subtle">ou cole o conteúdo</Text>
        <View className="flex-1 h-px bg-border" />
      </View>

      <TextField value={text} onChangeText={setText} placeholder="Cole aqui o JSON ou as células copiadas da planilha" multiline className="text-xs min-h-32" autoCapitalize="none" autoCorrect={false} />
      <Button
        label="Colar da área de transferência"
        icon={ClipboardPaste}
        variant="ghost"
        size="sm"
        className="self-start -ml-2 -mt-3"
        onPress={async () => setText(await Clipboard.getStringAsync())}
      />

      {errorBox}

      <Button label="Continuar" size="lg" disabled={!text.trim()} onPress={() => { setFileName(null); parse(text) }} />

      <View className="gap-3">
        <Pressable onPress={() => setShowFormats(value => !value)} className="flex-row items-center gap-1">
          <Text className="text-sm font-semibold text-primary">Ver formatos aceitos</Text>
          <ChevronDown size={16} color={colors.primary} style={{ transform: [{ rotate: showFormats ? '180deg' : '0deg' }] }} />
        </Pressable>
        {showFormats && (
          <View className="gap-4">
            <Card className="p-4 gap-2">
              <Text variant="subheading">Planilha (Excel, Google Sheets, CSV)</Text>
              <Text tone="muted" className="text-sm leading-5">
                Uma linha por exercício, com as colunas dia, treino, exercicio, series, repeticoes, peso, descanso (ex.: 1:30), progressao (ex.: 12x40 / 10x45) e nota.
                Deixe dia e treino vazios para repetir os da linha de cima.
              </Text>
              <Button label="Baixar modelo de planilha" icon={FileDown} variant="secondary" size="sm" onPress={() => shareCsvTemplate().catch(() => toast.error('Não foi possível gerar o modelo.'))} />
            </Card>
            <Card className="p-4 gap-2">
              <View className="flex-row items-center justify-between">
                <Text variant="subheading">JSON</Text>
                <Button
                  label="Copiar exemplo"
                  variant="ghost"
                  size="sm"
                  className="-mr-2"
                  onPress={async () => {
                    await Clipboard.setStringAsync(JSON_EXAMPLE)
                    toast.success('Exemplo copiado')
                  }}
                />
              </View>
              <View className="bg-surface-2 rounded-xl p-3">
                <Text selectable className="text-[11px] leading-4 font-mono text-muted">{JSON_EXAMPLE}</Text>
              </View>
            </Card>
          </View>
        )}
      </View>
    </ScreenScroll>
  )
}
