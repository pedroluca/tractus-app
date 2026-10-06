import { router, useFocusEffect } from 'expo-router'
import { Award, CalendarDays, Dumbbell, TrendingDown, TrendingUp } from 'lucide-react-native'
import { useCallback, useMemo, useState } from 'react'
import { View } from 'react-native'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState, StatTile } from '@/components/ui/misc'
import { SelectField } from '@/components/ui/picker-sheet'
import { ScreenScroll, SectionTitle, TabHeader } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { WeightChart, type ChartPoint } from '@/components/weight-chart'
import { getAllUserLogs } from '@/data/logs'
import type { LogEntry } from '@/data/types'
import { cn } from '@/lib/cn'
import { formatDate, formatDecimal, formatWeight, getLocalDateKey } from '@/lib/dates'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

/** Carga considerada do registro: na progressão, a maior carga das séries */
const logWeight = (log: LogEntry) =>
  log.usesProgressiveWeight && log.progressiveSets?.length ? Math.max(...log.progressiveSets.map(set => set.weight)) : log.peso

type Session = { dateKey: string; date: string; weight: number }

export default function ProgressScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [selected, setSelected] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      setLogs(await getAllUserLogs(profile.id))
    } catch {
      setLogs(current => current ?? [])
    }
  }, [profile.id])

  useFocusEffect(useCallback(() => {
    load()
  }, [load]))

  // Exercícios ordenados pelos mais registrados
  const exerciseOptions = useMemo(() => {
    const counts = new Map<string, number>()
    logs?.forEach(log => counts.set(log.titulo, (counts.get(log.titulo) ?? 0) + 1))
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .map(([title, count]) => ({ value: title, label: title, description: `${count} ${count === 1 ? 'registro' : 'registros'}` }))
  }, [logs])

  const exercise = selected && exerciseOptions.some(option => option.value === selected) ? selected : exerciseOptions[0]?.value ?? null

  // Uma sessão por dia, com a maior carga do dia
  const sessions = useMemo<Session[]>(() => {
    if (!logs || !exercise) return []
    const byDay = new Map<string, Session>()
    for (const log of logs) {
      if (log.titulo !== exercise) continue
      const dateKey = getLocalDateKey(new Date(log.data))
      const weight = logWeight(log)
      const current = byDay.get(dateKey)
      if (!current || weight > current.weight) byDay.set(dateKey, { dateKey, date: log.data, weight })
    }
    return Array.from(byDay.values()).sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [logs, exercise])

  const overall = useMemo(() => ({
    days: new Set((logs ?? []).map(log => getLocalDateKey(new Date(log.data)))).size,
    exercises: exerciseOptions.length,
    maxWeight: Math.max(0, ...(logs ?? []).map(logWeight)),
  }), [logs, exerciseOptions.length])

  const record = sessions.length ? Math.max(...sessions.map(session => session.weight)) : 0
  const first = sessions[0]?.weight ?? 0
  const last = sessions.at(-1)?.weight ?? 0
  const change = first > 0 ? ((last - first) / first) * 100 : 0

  const points: ChartPoint[] = sessions.map(session => ({
    value: session.weight,
    label: formatDate(session.date, { day: '2-digit', month: '2-digit' }),
    date: formatDate(session.date, { day: '2-digit', month: 'short', year: 'numeric' }),
  }))

  return (
    <ScreenScroll
      header={<TabHeader title="Progresso" subtitle="Sua evolução de carga" />}
      refreshing={refreshing}
      onRefresh={async () => {
        setRefreshing(true)
        await load()
        setRefreshing(false)
      }}
    >
      {logs === null ? (
        <LoadingState />
      ) : logs.length === 0 ? (
        <Card>
          <EmptyState
            icon={TrendingUp}
            title="Ainda sem dados de progresso"
            description="Conclua exercícios na aba Treino e a evolução da sua carga aparece aqui."
            actionLabel="Ir para o treino"
            onAction={() => router.navigate('/')}
          />
        </Card>
      ) : (
        <>
          <View className="flex-row gap-2">
            <StatTile label="Dias treinados" value={overall.days} icon={CalendarDays} />
            <StatTile label="Exercícios" value={overall.exercises} icon={Dumbbell} />
            <StatTile label="Maior carga" value={formatWeight(overall.maxWeight)} suffix="kg" icon={Award} />
          </View>

          <SelectField label="Exercício" value={exercise} options={exerciseOptions} onChange={setSelected} sheetTitle="Escolha o exercício" />

          {exercise && sessions.length > 0 && (
            <>
              <View className="flex-row gap-2">
                <StatTile label="Recorde" value={formatWeight(record)} suffix="kg" color={colors.primary} />
                <StatTile label="Última carga" value={formatWeight(last)} suffix="kg" />
                <StatTile label="Sessões" value={sessions.length} />
              </View>

              <Card className="p-4 gap-3">
                <View className="flex-row items-start justify-between">
                  <View className="gap-0.5 flex-1">
                    <Text variant="subheading">Evolução da carga</Text>
                    <Text variant="caption" tone="muted">Maior carga de cada dia · toque no gráfico para ver o valor</Text>
                  </View>
                  {sessions.length > 1 && (
                    <View className={cn('flex-row items-center gap-1 px-2.5 py-1 rounded-full', change >= 0 ? 'bg-success/10' : 'bg-danger/10')}>
                      {change >= 0 ? <TrendingUp size={14} color={colors.success} /> : <TrendingDown size={14} color={colors.danger} />}
                      <Text className={cn('text-sm font-semibold', change >= 0 ? 'text-success' : 'text-danger')}>
                        {change > 0 ? '+' : ''}{formatDecimal(change)}%
                      </Text>
                    </View>
                  )}
                </View>
                {sessions.length > 1 ? (
                  <WeightChart points={points} />
                ) : (
                  <Text tone="muted" className="text-sm py-6 text-center">Registre esse exercício em mais um dia para ver o gráfico.</Text>
                )}
              </Card>

              <View className="gap-2">
                <SectionTitle title="Sessões recentes" />
                <Card className="overflow-hidden">
                  {sessions.slice(-10).reverse().map((session, index) => {
                    const isRecord = session.weight === record
                    return (
                      <View key={session.dateKey}>
                        {index > 0 && <View className="h-px bg-border mx-4" />}
                        <View className="flex-row items-center px-4 py-3 gap-3">
                          <Text className="flex-1 text-base">
                            {formatDate(session.date, { weekday: 'short', day: '2-digit', month: 'short' })}
                          </Text>
                          {isRecord && (
                            <View className="flex-row items-center gap-1 px-2 py-0.5 rounded-full bg-premium/15">
                              <Award size={12} color={colors.premium} />
                              <Text className="text-xs font-semibold text-premium">Recorde</Text>
                            </View>
                          )}
                          <Text className="text-base font-semibold tabular-nums">{formatWeight(session.weight)} kg</Text>
                        </View>
                      </View>
                    )
                  })}
                </Card>
                {sessions.length > 10 && (
                  <Text variant="caption" tone="subtle" className="text-center">Mostrando as últimas 10 de {sessions.length} sessões</Text>
                )}
              </View>
            </>
          )}
        </>
      )}
    </ScreenScroll>
  )
}
