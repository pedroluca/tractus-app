import { Redirect } from 'expo-router'
import { ChevronLeft, ChevronRight, Dumbbell, Flame, Snowflake, Trophy } from 'lucide-react-native'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { LoadingState, StatTile } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { getWorkoutDates } from '@/data/logs'
import { getFreezeCap, getWeekKey } from '@/data/streak'
import { trackStreakCalendarViewed } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

type DayStatus = 'completed' | 'missed' | 'scheduled' | 'none'
type CalendarDay = { date: Date; status: DayStatus; isToday: boolean; isStreakWeek: boolean } | null

const WEEKDAY_LABELS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
// A contagem de streak começou em 8/10/2025: antes disso nenhum dia aparece como falta
const STREAK_START = new Date(2025, 9, 8)

function buildMonth(month: Date, scheduled: number[], completed: Set<string>): CalendarDay[] {
  const year = month.getFullYear()
  const monthIndex = month.getMonth()
  const firstWeekday = new Date(year, monthIndex, 1).getDay()
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Streak é semanal: um dia agendado só é falta se a semana inteira ficou sem treino
  const weeksWithWorkout = new Set(Array.from(completed, dateString => getWeekKey(new Date(dateString))))

  const days: CalendarDay[] = Array.from({ length: firstWeekday }, () => null)
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, monthIndex, day)
    const isStreakWeek = weeksWithWorkout.has(getWeekKey(date))
    let status: DayStatus = 'none'
    if (completed.has(date.toDateString())) status = 'completed'
    else if (scheduled.includes(date.getDay()) && date >= STREAK_START) {
      if (date < today) status = isStreakWeek ? 'none' : 'missed'
      else status = 'scheduled'
    }
    days.push({ date, status, isToday: date.getTime() === today.getTime(), isStreakWeek })
  }
  while (days.length % 7 !== 0) days.push(null)
  return days
}

export default function StreakCalendarScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const [completed, setCompleted] = useState<Set<string> | null>(null)
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1))

  useEffect(() => {
    if (!profile.isPremium) return
    trackStreakCalendarViewed()
    getWorkoutDates(profile.id).then(setCompleted).catch(() => setCompleted(new Set()))
  }, [profile.id, profile.isPremium])

  const days = useMemo(
    () => (completed ? buildMonth(month, profile.scheduledDays ?? [], completed) : []),
    [month, profile.scheduledDays, completed],
  )

  if (!profile.isPremium) return <Redirect href="/premium" />
  if (!completed) return <LoadingState />

  const now = new Date()
  const isCurrentMonth = month.getFullYear() === now.getFullYear() && month.getMonth() === now.getMonth()
  const monthLabel = month.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const weeks = Array.from({ length: days.length / 7 }, (_, index) => days.slice(index * 7, index * 7 + 7))
  const workoutsThisMonth = days.filter(day => day?.status === 'completed').length

  return (
    <ScreenScroll contentClassName="pt-2">
      <View className="flex-row gap-2">
        <StatTile label="Atual" value={profile.currentStreak ?? 0} suffix="sem" icon={Flame} color={colors.streak} />
        <StatTile label="Recorde" value={profile.longestStreak ?? 0} suffix="sem" icon={Trophy} />
      </View>
      <View className="flex-row gap-2">
        <StatTile label="Treinos" value={profile.totalWorkouts ?? 0} icon={Dumbbell} />
        <StatTile label="Freezes" value={`${profile.freezeCount ?? 0}/${getFreezeCap(true)}`} icon={Snowflake} color={colors.info} />
      </View>

      <Card className="p-4 gap-4">
        <View className="flex-row items-center justify-between">
          <IconButton icon={ChevronLeft} variant="surface" accessibilityLabel="Mês anterior" onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() - 1, 1))} />
          <View className="items-center">
            <Text className="text-lg font-semibold capitalize">{monthLabel}</Text>
            <Text variant="caption" tone="muted">{workoutsThisMonth} {workoutsThisMonth === 1 ? 'dia treinado' : 'dias treinados'}</Text>
          </View>
          <IconButton icon={ChevronRight} variant="surface" accessibilityLabel="Próximo mês" disabled={isCurrentMonth} onPress={() => setMonth(current => new Date(current.getFullYear(), current.getMonth() + 1, 1))} />
        </View>

        <View className="gap-1.5">
          <View className="flex-row">
            {WEEKDAY_LABELS.map((label, index) => (
              <Text key={index} variant="caption" tone="subtle" className="flex-1 text-center font-semibold">{label}</Text>
            ))}
          </View>
          {weeks.map((week, weekIndex) => {
            const streakWeek = week.some(day => day?.isStreakWeek)
            return (
              <View key={weekIndex} className={cn('flex-row rounded-xl py-1', streakWeek && 'bg-streak/10')}>
                {week.map((day, dayIndex) => (
                  <View key={dayIndex} className="flex-1 items-center">
                    {day && (
                      <View
                        accessibilityLabel={`${day.date.getDate()}, ${day.status === 'completed' ? 'treinou' : day.status === 'missed' ? 'faltou' : day.status === 'scheduled' ? 'treino agendado' : 'sem treino'}`}
                        className={cn(
                          'w-9 h-9 rounded-full items-center justify-center',
                          day.status === 'completed' && 'bg-streak',
                          day.status === 'missed' && 'bg-danger/10',
                          day.status === 'scheduled' && 'border border-primary/60',
                          day.isToday && day.status !== 'completed' && 'border-2 border-foreground',
                        )}
                      >
                        <Text
                          className={cn(
                            'text-sm',
                            day.status === 'completed' ? 'text-white font-bold' : day.status === 'missed' ? 'text-danger' : 'text-foreground',
                            day.isToday && 'font-bold',
                          )}
                        >
                          {day.date.getDate()}
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )
          })}
        </View>

        {!isCurrentMonth && (
          <Pressable onPress={() => setMonth(new Date(now.getFullYear(), now.getMonth(), 1))} className="self-center">
            <Text className="text-sm font-semibold text-primary">Voltar para o mês atual</Text>
          </Pressable>
        )}
      </Card>

      <Card className="p-4 gap-2.5">
        <Legend swatch={<View className="w-4 h-4 rounded-full bg-streak" />} label="Dia com treino" />
        <Legend swatch={<View className="w-4 h-4 rounded bg-streak/20" />} label="Semana que entrou na sequência" />
        <Legend swatch={<View className="w-4 h-4 rounded-full border border-primary/60" />} label="Dia agendado" />
        <Legend swatch={<View className="w-4 h-4 rounded-full bg-danger/15" />} label="Semana sem treino (falta)" />
      </Card>

      <Text variant="caption" tone="subtle" className="text-center px-4">
        Os dias agendados são os dias da semana em que você tem treino com exercícios cadastrados.
      </Text>
    </ScreenScroll>
  )
}

function Legend({ swatch, label }: { swatch: ReactNode; label: string }) {
  return (
    <View className="flex-row items-center gap-3">
      {swatch}
      <Text tone="muted" className="text-sm">{label}</Text>
    </View>
  )
}
