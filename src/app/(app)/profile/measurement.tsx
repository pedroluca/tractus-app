import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Callout } from '@/components/ui/misc'
import { DateField } from '@/components/ui/picker-sheet'
import { ScreenScroll } from '@/components/ui/screen'
import { StepperField } from '@/components/ui/stepper-field'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { addMeasurement, calculateBmi, getBmiCategory, InvalidMeasurementError } from '@/data/body-metrics'
import { trackMetricsUpdated } from '@/lib/analytics'
import { formatDecimal } from '@/lib/dates'
import { haptics } from '@/lib/haptics'
import { settle } from '@/lib/writes'
import { useCurrentUser } from '@/providers/session-provider'

export default function NewMeasurementScreen() {
  const profile = useCurrentUser()
  // Começa com as últimas medidas para o usuário só ajustar
  const [height, setHeight] = useState(profile.altura ? profile.altura / 100 : 1.7)
  const [weight, setWeight] = useState(profile.peso ?? 70)
  const [date, setDate] = useState(new Date())
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const bmi = calculateBmi(weight, height * 100)
  const category = getBmiCategory(bmi)

  const save = async () => {
    setSaving(true)
    setError(null)
    try {
      await settle(addMeasurement({ userId: profile.id, date, weightKg: weight, heightM: height, notes: profile.isPremium ? notes : undefined }))
      trackMetricsUpdated(weight, Math.round(height * 100))
      haptics.success()
      router.back()
    } catch (err) {
      setError(err instanceof InvalidMeasurementError ? err.message : 'Não foi possível salvar a medição.')
      setSaving(false)
    }
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      {error && <Callout tone="danger">{error}</Callout>}

      <StepperField label="Altura" value={height} onChange={setHeight} step={0.01} min={0.5} max={3} decimals={2} suffix="m" />
      <StepperField label="Peso" value={weight} onChange={setWeight} step={0.1} min={20} max={500} decimals={1} suffix="kg" />
      <DateField label="Data da medição" value={date} onChange={setDate} maximumDate={new Date()} />
      {profile.isPremium && (
        <TextField label="Observações (opcional)" value={notes} onChangeText={setNotes} placeholder="Ex.: medido em jejum" multiline maxLength={300} />
      )}

      <Card className="p-4 flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text variant="caption" tone="muted">IMC calculado</Text>
          <Text className="text-2xl font-bold">{formatDecimal(bmi)}</Text>
        </View>
        {category && <Text tone="muted" className="text-sm font-medium">{category.label}</Text>}
      </Card>

      <Button label="Salvar medição" size="lg" loading={saving} onPress={save} />
    </ScreenScroll>
  )
}
