import { router, useFocusEffect } from 'expo-router'
import { Flame, Inbox, Search, UserPlus, UsersRound } from 'lucide-react-native'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { FlatList, RefreshControl, TextInput, View } from 'react-native'
import { useTabBarInset } from '@/components/floating-tab-bar'
import { IconButton } from '@/components/ui/icon-button'
import { EmptyState, LoadingState } from '@/components/ui/misc'
import { TabHeader } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { UserRow } from '@/components/user-row'
import { getFriends, subscribePendingRequestsCount, type Friend } from '@/data/friends'
import { getWeekKey } from '@/data/streak'
import { cn } from '@/lib/cn'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

export default function FriendsScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const tabBarInset = useTabBarInset()
  const [friends, setFriends] = useState<Friend[] | null>(null)
  const [refreshing, setRefreshing] = useState(false)
  const [search, setSearch] = useState('')
  const [pending, setPending] = useState(0)

  useEffect(() => subscribePendingRequestsCount(profile.id, setPending), [profile.id])

  const load = useCallback(async () => {
    try {
      setFriends(await getFriends(profile.id))
    } catch {
      setFriends(current => current ?? [])
    }
  }, [profile.id])

  // Recarrega ao voltar para a aba (ex.: depois de aceitar uma solicitação)
  useFocusEffect(useCallback(() => {
    load()
  }, [load]))

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase()
    if (!friends || !term) return friends ?? []
    return friends.filter(({ user }) => user.nome.toLowerCase().includes(term) || user.username?.toLowerCase().includes(term))
  }, [friends, search])

  const currentWeek = getWeekKey()

  return (
    <View className="flex-1 bg-background">
      <TabHeader
        title="Amigos"
        right={(
          <>
            <IconButton icon={Inbox} variant="surface" accessibilityLabel="Solicitações de amizade" badge={pending} onPress={() => router.push('/friends/requests')} />
            <IconButton icon={UserPlus} variant="primary" accessibilityLabel="Adicionar amigo" onPress={() => router.push('/friends/add')} />
          </>
        )}
      />

      {friends === null ? (
        <LoadingState />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.friendshipId}
          contentContainerStyle={{ paddingBottom: tabBarInset + 24 }}
          keyboardShouldPersistTaps="handled"
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={async () => { setRefreshing(true); await load(); setRefreshing(false) }} colors={[colors.primary]} tintColor={colors.primary} />}
          ListHeaderComponent={friends.length > 0 ? (
            <View className="px-4 pb-3 w-full max-w-2xl self-center">
              <View className="flex-row items-center h-11 px-3.5 rounded-xl bg-surface-2 gap-2">
                <Search size={18} color={colors.subtle} />
                <TextInput
                  value={search}
                  onChangeText={setSearch}
                  placeholder="Buscar entre seus amigos"
                  placeholderTextColor={colors.subtle}
                  className="flex-1 text-base text-foreground"
                  autoCapitalize="none"
                  returnKeyType="search"
                />
              </View>
            </View>
          ) : null}
          ListEmptyComponent={friends.length === 0 ? (
            <EmptyState
              icon={UsersRound}
              title="Você ainda não adicionou amigos"
              description="Encontre pessoas pelo nome ou username e acompanhe a sequência de treinos delas."
              actionLabel="Adicionar amigo"
              onAction={() => router.push('/friends/add')}
            />
          ) : (
            <Text tone="muted" className="text-center py-10">Nenhum amigo encontrado com “{search}”.</Text>
          )}
          renderItem={({ item, index }) => {
            const streak = item.user.currentStreak ?? 0
            const active = item.user.lastStreakWeek === currentWeek
            const hidesStreak = item.user.privacidade?.ocultarStreak
            return (
              <View className="w-full max-w-2xl self-center px-4">
                <View className={cn('bg-surface border-x border-border overflow-hidden', index === 0 && 'rounded-t-2xl border-t', index === filtered.length - 1 && 'rounded-b-2xl border-b')}>
                  {index > 0 && <View className="h-px bg-border ml-[72px]" />}
                  <UserRow
                    user={item.user}
                    onPress={() => router.push({ pathname: '/friend/[id]', params: { id: item.user.id } })}
                    right={hidesStreak ? undefined : (
                      <View className={cn('flex-row items-center gap-1 px-2.5 h-8 rounded-full', active ? 'bg-streak/15' : 'bg-surface-2')}>
                        <Flame size={14} color={active ? colors.streak : colors.subtle} fill={active ? colors.streak : 'transparent'} />
                        <Text className={cn('text-sm font-semibold', active ? 'text-streak' : 'text-muted')}>{streak}</Text>
                      </View>
                    )}
                  />
                </View>
              </View>
            )
          }}
        />
      )}
    </View>
  )
}
