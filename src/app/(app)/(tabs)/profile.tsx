import { router, useFocusEffect } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import {
  Activity,
  AtSign,
  BadgeCheck,
  Award,
  CalendarDays,
  Camera,
  Crown,
  Download,
  FileJson,
  FileSpreadsheet,
  History,
  ImageMinus,
  ImagePlus,
  LogOut,
  Mail,
  Pencil,
  Plus,
  Settings,
  Share2,
  Trash2,
  TrendingUp,
  Upload,
} from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { BadgeStrip } from '@/components/badges'
import { Avatar } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { ListRow, ListSection } from '@/components/ui/list'
import { EmptyState, StatTile } from '@/components/ui/misc'
import { ScreenScroll, SectionTitle, TabHeader } from '@/components/ui/screen'
import { ActionSheet } from '@/components/ui/sheet'
import { Text } from '@/components/ui/text'
import { resolveAvatarTone, resolveUserBadges } from '@/data/badges'
import { calculateBmi, getBmiCategory } from '@/data/body-metrics'
import { getFriendsCount } from '@/data/friends'
import { setProfilePhoto } from '@/data/profile'
import { updateScheduledDays } from '@/data/streak'
import type { Treino } from '@/data/types'
import { compareWeekDays } from '@/data/week-days'
import { exportUserWorkouts } from '@/data/workout-transfer'
import { deleteWorkoutWithExercises, subscribeUserWorkouts } from '@/data/workouts'
import { ShareWorkoutSheet } from '@/features/profile/share-workout-sheet'
import { trackProfilePhotoUpdated } from '@/lib/analytics'
import { uploadImage } from '@/lib/api'
import { formatDecimal } from '@/lib/dates'
import { env } from '@/lib/env'
import { pickImage } from '@/lib/image'
import { appVersion } from '@/lib/version'
import { useCurrentUser, useSession } from '@/providers/session-provider'
import { useConfirm } from '@/providers/confirm-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

export default function ProfileScreen() {
  const profile = useCurrentUser()
  const { signOut } = useSession()
  const colors = useThemeColors()
  const toast = useToast()
  const confirm = useConfirm()

  const [workouts, setWorkouts] = useState<Treino[] | null>(null)
  const [friendsCount, setFriendsCount] = useState<number | null>(null)
  const [uploading, setUploading] = useState(false)
  const [photoMenu, setPhotoMenu] = useState(false)
  const [exportMenu, setExportMenu] = useState(false)
  const [workoutMenu, setWorkoutMenu] = useState<Treino | null>(null)
  const [sharing, setSharing] = useState<Treino | null>(null)

  useEffect(() => subscribeUserWorkouts(
    profile.id,
    list => setWorkouts([...list].sort((a, b) => compareWeekDays(a.dia, b.dia))),
    () => setWorkouts([]),
  ), [profile.id])

  useFocusEffect(useCallback(() => {
    getFriendsCount(profile.id).then(setFriendsCount).catch(() => {})
  }, [profile.id]))

  const badges = useMemo(() => resolveUserBadges(profile), [profile])
  const isPremium = !!profile.isPremium
  const bmi = calculateBmi(profile.peso ?? 0, profile.altura ?? 0)
  const bmiCategory = getBmiCategory(bmi)
  const hasMetrics = !!profile.altura && !!profile.peso

  const changePhoto = async () => {
    try {
      const uri = await pickImage({ square: true, maxSize: 600 })
      if (!uri) return
      setUploading(true)
      const url = await uploadImage(uri, profile.id, 'profile')
      await setProfilePhoto(profile.id, url)
      trackProfilePhotoUpdated()
      toast.success('Foto atualizada')
    } catch (error) {
      toast.error(error instanceof Error && error.message === 'permission'
        ? 'Permita o acesso às fotos nas configurações do aparelho.'
        : 'Não foi possível atualizar a foto. Tente novamente.')
    } finally {
      setUploading(false)
    }
  }

  const removePhoto = () => {
    setProfilePhoto(profile.id, null).catch(() => toast.error('Não foi possível remover a foto.'))
  }

  const confirmDeleteWorkout = (workout: Treino) => {
    confirm({
      title: 'Excluir treino',
      message: `Excluir "${workout.musculo}" (${workout.dia}) e todos os exercícios dele?`,
      confirmLabel: 'Excluir',
      icon: Trash2,
      onConfirm: () => deleteWorkoutWithExercises(workout.id)
        .then(() => updateScheduledDays(profile.id))
        .catch(() => toast.error('Não foi possível excluir o treino.')),
    })
  }

  const runExport = async (format: 'json' | 'csv') => {
    try {
      const count = await exportUserWorkouts(profile.id, format)
      if (count === 0) toast.show('Você ainda não tem treinos para exportar.')
    } catch {
      toast.error('Não foi possível exportar os treinos.')
    }
  }

  const confirmSignOut = () => {
    confirm({
      title: 'Sair da conta',
      message: 'Você precisará entrar de novo para acessar seus treinos.',
      confirmLabel: 'Sair',
      icon: LogOut,
      onConfirm: () => signOut(),
    })
  }

  const lockedOrGo = (premiumRoute: Parameters<typeof router.push>[0]) => () => router.push(isPremium ? premiumRoute : '/premium')

  return (
    <ScreenScroll
      header={(
        <TabHeader
          title="Perfil"
          right={(
            <>
              <IconButton icon={Pencil} variant="surface" accessibilityLabel="Editar perfil" onPress={() => router.push('/profile/edit')} />
              <IconButton icon={Settings} variant="surface" accessibilityLabel="Configurações" onPress={() => router.push('/settings')} />
            </>
          )}
        />
      )}
    >
      {/* Identidade */}
      <Card className="p-4 gap-4">
        <View className="flex-row items-center gap-4">
          <Pressable accessibilityRole="button" accessibilityLabel="Alterar foto de perfil" onPress={() => setPhotoMenu(true)} disabled={uploading}>
            <Avatar name={profile.nome} uri={profile.photoURL} size={76} ring={resolveAvatarTone(badges)} />
            <View className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-surface border border-border items-center justify-center">
              {uploading ? <ActivityIndicator size="small" color={colors.primary} /> : <Camera size={14} color={colors.foreground} />}
            </View>
          </Pressable>
          <View className="flex-1 gap-1">
            <Text variant="heading" numberOfLines={2}>{profile.nome}</Text>
            {profile.username ? (
              <Text tone="muted" className="text-sm">@{profile.username}</Text>
            ) : (
              <Pressable onPress={() => router.push('/profile/edit')}>
                <Text className="text-sm text-primary font-medium">Definir username</Text>
              </Pressable>
            )}
            <View className="mt-1">
              <BadgeStrip badges={badges} viewAllHref="/profile/badges" viewerIsPremium={isPremium} />
            </View>
          </View>
        </View>

        {!!profile.bio && <Text className="text-sm leading-5">{profile.bio}</Text>}

        <View className="gap-2">
          {!!profile.email && <InfoLine icon={Mail} text={profile.email} />}
          {!!profile.instagram && (
            <InfoLine icon={AtSign} text={`@${profile.instagram}`} onPress={() => WebBrowser.openBrowserAsync(`https://instagram.com/${profile.instagram}`)} />
          )}
          {profile.isTrainer && <InfoLine icon={BadgeCheck} text={profile.cref ? `CREF ${profile.cref}` : 'Treinador (CREF não informado)'} />}
        </View>
      </Card>

      {/* Estatísticas */}
      <View className="gap-2">
        <SectionTitle title="Estatísticas" />
        <View className="flex-row gap-2">
          <StatTile label="Sequência" value={profile.currentStreak ?? 0} suffix="sem" color={colors.streak} />
          <StatTile label="Recorde" value={profile.longestStreak ?? 0} suffix="sem" />
          <StatTile label="Treinos" value={profile.totalWorkouts ?? 0} />
        </View>
        <View className="flex-row gap-2">
          <StatTile label="Freezes" value={profile.freezeCount ?? 0} color={colors.info} />
          <StatTile label="Amigos" value={friendsCount ?? '—'} onPress={() => router.navigate('/friends')} />
        </View>
      </View>

      {/* Medidas */}
      <View className="gap-2">
        <SectionTitle title="Medidas" />
        <Card className="p-4 gap-4">
          {hasMetrics ? (
            <View className="flex-row">
              <Measure label="Altura" value={`${formatDecimal((profile.altura ?? 0) / 100, 2)} m`} />
              <Measure label="Peso" value={`${formatDecimal(profile.peso ?? 0)} kg`} />
              <Measure label="IMC" value={formatDecimal(bmi)} hint={bmiCategory?.label} />
            </View>
          ) : (
            <Text tone="muted" className="text-sm leading-5">Registre altura e peso para acompanhar seu IMC e a evolução do seu corpo.</Text>
          )}
          <View className="flex-row gap-2">
            <Button label={hasMetrics ? 'Nova medição' : 'Adicionar medidas'} icon={Plus} variant="secondary" size="sm" className="flex-1" onPress={() => router.push('/profile/measurement')} />
            {hasMetrics && (
              <Button label="Histórico" icon={isPremium ? Activity : Crown} variant="secondary" size="sm" className="flex-1" onPress={lockedOrGo('/profile/body-metrics')} />
            )}
          </View>
        </Card>
      </View>

      <ListSection title="Atalhos">
        <ListRow title="Progresso" description="Evolução da carga em cada exercício" icon={TrendingUp} iconColor={colors.primary} onPress={() => router.push('/profile/progress')} />
        <ListRow title="Calendário de streak" icon={CalendarDays} iconColor={colors.streak} onPress={lockedOrGo('/profile/streak-calendar')} value={isPremium ? undefined : 'Premium'} />
        <ListRow title="Histórico de atividades" icon={History} onPress={() => router.push('/profile/log')} />
        <ListRow title="Conquistas" icon={Award} iconColor={colors.premium} onPress={() => router.push('/profile/badges')} />
        {!isPremium && <ListRow title="Seja Premium" description="Calendário, cores, métricas e mais" icon={Crown} iconColor={colors.premium} onPress={() => router.push('/premium')} />}
      </ListSection>

      {/* Treinos */}
      <View className="gap-2">
        <SectionTitle
          title={`Meus treinos${workouts?.length ? ` · ${workouts.length}` : ''}`}
          action={(
            <View className="flex-row gap-1 -my-2">
              <IconButton icon={Download} size={36} iconSize={18} accessibilityLabel="Importar treinos" onPress={() => router.push('/transfer/import')} />
              <IconButton icon={Upload} size={36} iconSize={18} accessibilityLabel="Exportar treinos" onPress={() => setExportMenu(true)} />
            </View>
          )}
        />
        {workouts && workouts.length === 0 ? (
          <Card>
            <EmptyState
              icon={CalendarDays}
              title="Nenhum treino cadastrado"
              description="Crie seu primeiro treino na aba Treino ou importe de uma planilha."
              actionLabel="Importar treinos"
              onAction={() => router.push('/transfer/import')}
            />
          </Card>
        ) : (
          <Card className="overflow-hidden">
            {(workouts ?? []).map((workout, index) => (
              <View key={workout.id}>
                {index > 0 && <View className="h-px bg-border mx-4" />}
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setWorkoutMenu(workout)}
                  className="flex-row items-center gap-3 px-4 py-3.5 active:bg-surface-2"
                >
                  <View className="w-12">
                    <Text variant="caption" tone="muted">{workout.dia.slice(0, 3)}</Text>
                  </View>
                  <Text className="flex-1 text-base font-medium" numberOfLines={1}>{workout.musculo}</Text>
                  <Share2 size={16} color={colors.subtle} />
                </Pressable>
              </View>
            ))}
          </Card>
        )}
      </View>

      <Button label="Sair da conta" icon={LogOut} variant="danger-soft" onPress={confirmSignOut} />

      <View className="items-center gap-1 pb-2">
        <Text variant="caption" tone="subtle">Tractus v{appVersion}</Text>
        <Pressable onPress={() => WebBrowser.openBrowserAsync(env.developerUrl)}>
          <Text variant="caption" tone="subtle">Desenvolvido por <Text variant="caption" tone="primary">Pedro Luca Prates</Text></Text>
        </Pressable>
      </View>

      <ActionSheet
        visible={photoMenu}
        onClose={() => setPhotoMenu(false)}
        title="Foto de perfil"
        actions={[
          { label: profile.photoURL ? 'Escolher outra foto' : 'Escolher foto', icon: ImagePlus, onPress: changePhoto },
          ...(profile.photoURL ? [{ label: 'Remover foto', icon: ImageMinus, destructive: true, onPress: removePhoto }] : []),
        ]}
      />
      <ActionSheet
        visible={exportMenu}
        onClose={() => setExportMenu(false)}
        title="Exportar treinos"
        actions={[
          { label: 'JSON (backup completo)', icon: FileJson, onPress: () => runExport('json') },
          { label: 'Planilha (CSV)', icon: FileSpreadsheet, onPress: () => runExport('csv') },
        ]}
      />
      <ActionSheet
        visible={!!workoutMenu}
        onClose={() => setWorkoutMenu(null)}
        title={workoutMenu ? `${workoutMenu.musculo} · ${workoutMenu.dia}` : undefined}
        actions={workoutMenu ? [
          { label: 'Compartilhar', icon: Share2, onPress: () => setSharing(workoutMenu) },
          { label: 'Editar treino', icon: Pencil, onPress: () => router.push({ pathname: '/workout/[workoutId]/edit', params: { workoutId: workoutMenu.id } }) },
          { label: 'Excluir treino', icon: Trash2, destructive: true, onPress: () => confirmDeleteWorkout(workoutMenu) },
        ] : []}
      />
      <ShareWorkoutSheet workout={sharing} ownerId={profile.id} onClose={() => setSharing(null)} />
    </ScreenScroll>
  )
}

function InfoLine({ icon: Icon, text, onPress }: { icon: typeof Mail; text: string; onPress?: () => void }) {
  const colors = useThemeColors()
  return (
    <Pressable disabled={!onPress} onPress={onPress} className="flex-row items-center gap-2.5">
      <Icon size={16} color={colors.muted} />
      <Text tone={onPress ? 'primary' : 'muted'} className="text-sm flex-1" numberOfLines={1}>{text}</Text>
    </Pressable>
  )
}

function Measure({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <View className="flex-1 gap-0.5">
      <Text variant="caption" tone="muted">{label}</Text>
      <Text className="text-lg font-bold">{value}</Text>
      {hint && <Text variant="caption" tone="subtle">{hint}</Text>}
    </View>
  )
}
