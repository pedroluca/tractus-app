import { Redirect, router } from 'expo-router'
import { Activity, Minus, Plus, Trash2, TrendingDown, TrendingUp } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Alert, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { Callout, EmptyState, LoadingState, StatTile } from '@/components/ui/misc'
import { ScreenScroll, SectionTitle } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { WeightChart } from '@/components/weight-chart'
import { deleteMeasurement, getBmiCategory, subscribeMeasurements } from '@/data/body-metrics'
import type { BodyMeasurement } from '@/data/types'
import { formatDate, formatDecimal } from '@/lib/dates'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

export default function BodyMetricsScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()
  const [measurements, setMeasurements] = useState<BodyMeasurement[] | null>(null)

  useEffect(() => {
    if (!profile.isPremium) return
    return subscribeMeasurements(profile.id, setMeasurements, () => setMeasurements([]))
  }, [profile.id, profile.isPremium])

  if (!profile.isPremium) return <Redirect href="/premium" />
  if (!measurements) return <LoadingState />

  const latest = measurements[0]
  const oldest = measurements.at(-1)
  const change = latest && oldest && measurements.length > 1 ? latest.peso - oldest.peso : 0
  const category = latest ? getBmiCategory(latest.imc) : null

  // Faixa de peso para IMC normal (18,5 a 24,9) na altura atual
  const heightM = (latest?.altura ?? 0) / 100
  const minIdeal = 18.5 * heightM * heightM
  const maxIdeal = 24.9 * heightM * heightM

  const confirmDelete = (measurement: BodyMeasurement) => {
    Alert.alert('Excluir medição', `Excluir a medição de ${formatDate(measurement.data)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteMeasurement(measurement.id).catch(() => toast.error('Não foi possível excluir a medição.')),
      },
    ])
  }

  const chronological = [...measurements].reverse()

  return (
    <ScreenScroll contentClassName="pt-2">
      {measurements.length === 0 || !latest ? (
        <Card>
          <EmptyState
            icon={Activity}
            title="Nenhuma medição registrada"
            description="Registre seu peso e altura para acompanhar a evolução."
            actionLabel="Adicionar medição"
            onAction={() => router.push('/profile/measurement')}
          />
        </Card>
      ) : (
        <>
          <View className="flex-row gap-2">
            <StatTile label="Peso atual" value={formatDecimal(latest.peso)} suffix="kg" />
            <StatTile label="IMC" value={formatDecimal(latest.imc)} />
            <StatTile
              label="Variação total"
              value={`${change > 0 ? '+' : ''}${formatDecimal(change)}`}
              suffix="kg"
              icon={change > 0 ? TrendingUp : change < 0 ? TrendingDown : Minus}
            />
          </View>

          {category && latest.imc > 0 && category.tone !== 'success' && (
            <Callout tone={category.tone === 'info' ? 'info' : 'warning'} title={`IMC: ${category.label}`}>
              {`Para a faixa de IMC normal na sua altura, o peso fica entre ${formatDecimal(minIdeal)} e ${formatDecimal(maxIdeal)} kg.`}
            </Callout>
          )}

          {measurements.length > 1 && (
            <Card className="p-4 gap-3">
              <View className="gap-0.5">
                <Text variant="subheading">Evolução do peso</Text>
                <Text variant="caption" tone="muted">{measurements.length} medições registradas</Text>
              </View>
              <WeightChart
                points={chronological.map(item => ({
                  value: item.peso,
                  label: formatDate(item.data, { day: '2-digit', month: '2-digit' }),
                  date: formatDate(item.data, { day: '2-digit', month: 'short', year: 'numeric' }),
                }))}
              />
            </Card>
          )}

          <View className="gap-2">
            <SectionTitle
              title="Medições"
              action={<Button label="Nova" icon={Plus} variant="ghost" size="sm" className="-my-2 -mr-2" onPress={() => router.push('/profile/measurement')} />}
            />
            <Card className="overflow-hidden">
              {measurements.map((measurement, index) => (
                <View key={measurement.id}>
                  {index > 0 && <View className="h-px bg-border mx-4" />}
                  <View className="flex-row items-center pl-4 pr-2 py-2.5 gap-3">
                    <View className="flex-1 gap-0.5">
                      <Text className="text-base font-medium">{formatDate(measurement.data, { day: '2-digit', month: 'long', year: 'numeric' })}</Text>
                      <Text variant="caption" tone="muted">
                        {formatDecimal(measurement.altura / 100, 2)} m · IMC {formatDecimal(measurement.imc)}
                        {measurement.notas ? ` · ${measurement.notas}` : ''}
                      </Text>
                    </View>
                    <Text className="text-base font-semibold tabular-nums">{formatDecimal(measurement.peso)} kg</Text>
                    <IconButton icon={Trash2} size={36} iconSize={18} color={colors.subtle} accessibilityLabel="Excluir medição" onPress={() => confirmDelete(measurement)} />
                  </View>
                </View>
              ))}
            </Card>
          </View>
        </>
      )}
    </ScreenScroll>
  )
}
