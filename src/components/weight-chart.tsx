import { useState } from 'react'
import { View } from 'react-native'
import { LineChart } from 'react-native-gifted-charts'
import { formatWeight } from '@/lib/dates'
import { useThemeColors } from '@/theme/colors'
import { Text } from './ui/text'

export type ChartPoint = {
  value: number
  /** Rótulo curto do eixo X (ex.: 05/10) */
  label: string
  /** Data por extenso para o tooltip */
  date: string
}

type WeightChartProps = {
  points: ChartPoint[]
  unit?: string
  height?: number
}

const CHART_PADDING = 44

/** Gráfico de linha com área (evolução de carga e de peso corporal) */
export function WeightChart({ points, unit = 'kg', height = 200 }: WeightChartProps) {
  const colors = useThemeColors()
  const [width, setWidth] = useState(0)

  if (points.length === 0) return null

  const values = points.map(point => point.value)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(max - min, 1)

  // Eixo Y começa perto do menor valor (começar do zero achata a curva de quem levanta 40-60 kg)
  const step = range > 40 ? 10 : range > 12 ? 5 : range > 4 ? 2 : 1
  const offset = Math.max(0, Math.floor((min - range * 0.25) / step) * step)
  const top = Math.ceil((max + range * 0.15) / step) * step

  const plotWidth = Math.max(0, width - CHART_PADDING)
  const spacing = points.length > 1 ? Math.max(40, (plotWidth - 24) / (points.length - 1)) : plotWidth / 2
  // Com muitos pontos mostra só alguns rótulos para não amontoar
  const labelEvery = Math.max(1, Math.ceil((points.length * 40) / Math.max(plotWidth, 1) / 1.6))

  const data = points.map((point, index) => ({
    value: point.value,
    label: index % labelEvery === 0 || index === points.length - 1 ? point.label : '',
    date: point.date,
  }))

  return (
    <View onLayout={event => setWidth(event.nativeEvent.layout.width)} style={{ height: height + 40 }}>
      {width > 0 && (
        <LineChart
          data={data}
          width={plotWidth}
          height={height}
          areaChart
          curved
          curvature={0.15}
          isAnimated
          animationDuration={600}
          color={colors.primary}
          thickness={2.5}
          startFillColor={colors.primary}
          endFillColor={colors.primary}
          startOpacity={0.22}
          endOpacity={0.01}
          dataPointsColor={colors.primary}
          dataPointsRadius={points.length > 30 ? 0 : 3.5}
          spacing={spacing}
          initialSpacing={12}
          endSpacing={12}
          noOfSections={4}
          yAxisOffset={offset}
          maxValue={top - offset}
          yAxisThickness={0}
          xAxisThickness={1}
          xAxisColor={colors.border}
          rulesType="dashed"
          rulesColor={colors.border}
          dashWidth={4}
          dashGap={4}
          yAxisTextStyle={{ color: colors.subtle, fontSize: 11 }}
          xAxisLabelTextStyle={{ color: colors.subtle, fontSize: 10, width: 44, textAlign: 'center' }}
          yAxisLabelWidth={36}
          scrollToEnd
          pointerConfig={{
            pointerStripColor: colors.subtle,
            pointerStripWidth: 1,
            strokeDashArray: [3, 3],
            pointerColor: colors.primary,
            radius: 5,
            pointerLabelWidth: 120,
            pointerLabelHeight: 52,
            autoAdjustPointerLabelPosition: true,
            pointerLabelComponent: (items: { value: number; date: string }[]) => (
              <View className="bg-surface border border-border rounded-xl px-3 py-2" style={{ elevation: 4, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 6 }}>
                <Text className="text-base font-bold">{formatWeight(items[0].value)} {unit}</Text>
                <Text variant="caption" tone="muted">{items[0].date}</Text>
              </View>
            ),
          }}
        />
      )}
    </View>
  )
}
