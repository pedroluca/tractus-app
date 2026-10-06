import { collection, getDocs, limit, orderBy, query, where } from '@react-native-firebase/firestore'
import { router, Stack, useLocalSearchParams } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Activity, AtSign, Crown, Dumbbell, Lock, UserX } from 'lucide-react-native'
import { useEffect, useMemo, useState } from 'react'
import { Pressable, View } from 'react-native'
import { BadgeStrip } from '@/components/badges'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState, SegmentedControl, StatTile } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { resolveAvatarTone, resolveUserBadges } from '@/data/badges'
import { getFriendsCount } from '@/data/friends'
import { describeLog } from '@/data/logs'
import { findUserByIdOrUsername } from '@/data/profile'
import { parseLogDate } from '@/data/streak'
import type { LogEntry, UserProfile } from '@/data/types'
import { compareWeekDays } from '@/data/week-days'
import { getUserWorkouts, getWorkoutExercises } from '@/data/workouts'
import { formatDate, formatDecimal, formatTime, isWithinLastDays } from '@/lib/dates'
import { db } from '@/lib/firebase'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

type Tab = 'activity' | 'workouts'
type WorkoutSummary = { id: string; dia: string; musculo: string; exercises: string[] }

const PAGE = 10

export default function FriendProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const viewer = useCurrentUser()
  const colors = useThemeColors()
  const viewerIsPremium = !!viewer.isPremium

  const [user, setUser] = useState<UserProfile | null | undefined>(undefined)
  const [friendsCount, setFriendsCount] = useState<number | null>(null)
  const [tab, setTab] = useState<Tab>('activity')
  const [logs, setLogs] = useState<LogEntry[] | null>(null)
  const [logsLimit, setLogsLimit] = useState(PAGE)
  const [workouts, setWorkouts] = useState<WorkoutSummary[] | null>(null)

  useEffect(() => {
    findUserByIdOrUsername(id).then(found => {
      setUser(found)
      if (found) getFriendsCount(found.id).then(setFriendsCount).catch(() => {})
    }).catch(() => setUser(null))
  }, [id])

  const privacy = user?.privacidade ?? {}
  const userId = user?.id
  const activitiesHidden = !!privacy.ocultarAtividades

  useEffect(() => {
    if (!userId || activitiesHidden) return
    let active = true
    getDocs(query(collection(db, 'logs'), where('usuarioID', '==', userId), orderBy('data', 'desc'), limit(logsLimit)))
      .then(snapshot => snapshot.docs.map(logDoc => {
        const data = logDoc.data()
        return { id: logDoc.id, ...data, data: (parseLogDate(data.data) ?? new Date(0)).toISOString() } as LogEntry
      }))
      .catch(() => [] as LogEntry[])
      .then(list => {
        if (active) setLogs(list)
      })
    return () => {
      active = false
    }
  }, [userId, activitiesHidden, logsLimit])

  useEffect(() => {
    if (!userId || tab !== 'workouts' || workouts || privacy.ocultarTreinos) return
    getUserWorkouts(userId)
      .then(list => Promise.all(list.sort((a, b) => compareWeekDays(a.dia, b.dia)).map(async workout => ({
        id: workout.id,
        dia: workout.dia,
        musculo: workout.musculo,
        exercises: (await getWorkoutExercises(workout)).map(exercise => exercise.titulo),
      }))))
      .then(setWorkouts)
      .catch(() => setWorkouts([]))
  }, [userId, tab, workouts, privacy.ocultarTreinos])

  const badges = useMemo(() => (user ? resolveUserBadges(user) : []), [user])

  if (user === undefined) return <LoadingState />
  if (user === null) {
    return (
      <EmptyState icon={UserX} title="Usuário não encontrado" actionLabel="Voltar" onAction={() => router.back()} className="flex-1 justify-center" />
    )
  }

  // Sem Premium, o histórico de amigos fica limitado aos últimos 7 dias (regra do web)
  const visibleLogs = (logs ?? []).filter(log => viewerIsPremium || isWithinLastDays(log.data, 7))
  const lastOldLog = !viewerIsPremium ? (logs ?? []).find(log => !isWithinLastDays(log.data, 7)) : undefined
  const birthDate = !(privacy.ocultarNascimento ?? false) && user.dataNascimento
    ? new Date(`${user.dataNascimento}T00:00:00`).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    : null

  return (
    <ScreenScroll contentClassName="pt-2">
      <Stack.Screen options={{ title: user.username ? `@${user.username}` : user.nome.split(' ')[0] }} />

      <Card className="p-4 gap-4">
        <View className="flex-row items-center gap-4">
          <Avatar name={user.nome} uri={user.photoURL} size={76} ring={resolveAvatarTone(badges)} />
          <View className="flex-1 gap-1">
            <Text variant="heading" numberOfLines={2}>{user.nome}</Text>
            {user.isTrainer && <Text tone="muted" className="text-sm">{user.cref ? `Treinador · CREF ${user.cref}` : 'Treinador'}</Text>}
            <View className="mt-1">
              <BadgeStrip badges={badges} viewAllHref={{ pathname: '/friend/[id]/badges', params: { id: user.id } }} viewerIsPremium={viewerIsPremium} />
            </View>
          </View>
        </View>
        {!!user.bio && <Text className="text-sm leading-5">{user.bio}</Text>}
        {(!privacy.ocultarInstagram && user.instagram) || birthDate ? (
          <View className="gap-2">
            {!privacy.ocultarInstagram && !!user.instagram && (
              <Pressable onPress={() => WebBrowser.openBrowserAsync(`https://instagram.com/${user.instagram}`)} className="flex-row items-center gap-2.5">
                <AtSign size={16} color={colors.muted} />
                <Text tone="primary" className="text-sm">@{user.instagram}</Text>
              </Pressable>
            )}
            {birthDate && <Text tone="muted" className="text-sm">Aniversário em {birthDate}</Text>}
          </View>
        ) : null}
      </Card>

      <View className="flex-row gap-2">
        {!privacy.ocultarStreak && <StatTile label="Sequência" value={user.currentStreak ?? 0} suffix="sem" color={colors.streak} />}
        {!privacy.ocultarAmigos && (
          <StatTile label="Amigos" value={friendsCount ?? '—'} onPress={() => router.push({ pathname: '/friend/[id]/friends', params: { id: user.id } })} />
        )}
        {!privacy.ocultarPeso && !!user.peso && <StatTile label="Peso" value={formatDecimal(user.peso)} suffix="kg" />}
        {!privacy.ocultarAltura && !!user.altura && <StatTile label="Altura" value={formatDecimal(user.altura / 100, 2)} suffix="m" />}
      </View>

      <SegmentedControl<Tab>
        value={tab}
        onChange={setTab}
        options={[
          { value: 'activity', label: 'Atividades', icon: Activity },
          { value: 'workouts', label: 'Treinos', icon: Dumbbell },
        ]}
      />

      {tab === 'activity' ? (
        privacy.ocultarAtividades ? (
          <Card><EmptyState icon={Lock} title="Atividades privadas" description={`${user.nome.split(' ')[0]} prefere manter as atividades privadas.`} /></Card>
        ) : logs === null ? (
          <LoadingState />
        ) : visibleLogs.length === 0 && !lastOldLog ? (
          <Card><EmptyState icon={Activity} title="Nenhuma atividade recente" /></Card>
        ) : (
          <View className="gap-3">
            {visibleLogs.length > 0 && (
              <Card className="overflow-hidden">
                {visibleLogs.map((log, index) => (
                  <View key={log.id}>
                    {index > 0 && <View className="h-px bg-border mx-4" />}
                    <View className="flex-row px-4 py-3 gap-3">
                      <View className="flex-1 gap-0.5">
                        <Text className="text-base font-medium">{log.titulo}</Text>
                        <Text variant="caption" tone="muted">{describeLog(log)}</Text>
                      </View>
                      <View className="items-end gap-0.5">
                        <Text variant="caption" tone="muted">{formatDate(log.data, { day: '2-digit', month: 'short' })}</Text>
                        <Text variant="caption" tone="subtle">{formatTime(log.data)}</Text>
                      </View>
                    </View>
                  </View>
                ))}
              </Card>
            )}
            {lastOldLog && (
              <Card className="p-4 gap-3 items-center">
                <Text tone="muted" className="text-sm text-center">
                  Última atividade antes desta semana em {formatDate(lastOldLog.data, { day: '2-digit', month: 'long' })}. O histórico completo dos amigos é Premium.
                </Text>
                <Button label="Conhecer o Premium" icon={Crown} variant="secondary" size="sm" onPress={() => router.push('/premium')} />
              </Card>
            )}
            {viewerIsPremium && logs.length >= logsLimit && (
              <Button label="Ver mais atividades" variant="secondary" onPress={() => setLogsLimit(value => value + PAGE)} />
            )}
          </View>
        )
      ) : privacy.ocultarTreinos ? (
        <Card><EmptyState icon={Lock} title="Treinos privados" description="Este usuário prefere manter os treinos privados." /></Card>
      ) : workouts === null ? (
        <LoadingState />
      ) : workouts.length === 0 ? (
        <Card><EmptyState icon={Dumbbell} title="Nenhum treino cadastrado" /></Card>
      ) : (
        <View className="gap-3">
          {workouts.map(workout => (
            <Card key={workout.id} className="p-4 gap-2">
              <View className="flex-row items-center justify-between gap-2">
                <Text className="text-base font-semibold flex-1" numberOfLines={1}>{workout.musculo}</Text>
                <View className="px-2 py-0.5 rounded-md bg-surface-2">
                  <Text variant="caption" tone="muted">{workout.dia}</Text>
                </View>
              </View>
              {workout.exercises.length === 0 ? (
                <Text variant="caption" tone="subtle">Nenhum exercício</Text>
              ) : (
                <Text tone="muted" className="text-sm leading-5">{workout.exercises.join(' · ')}</Text>
              )}
            </Card>
          ))}
        </View>
      )}
    </ScreenScroll>
  )
}
