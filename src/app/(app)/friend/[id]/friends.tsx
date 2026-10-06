import { router, Stack, useLocalSearchParams } from 'expo-router'
import { Lock, UsersRound } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { UserRow } from '@/components/user-row'
import { getFriends, type Friend } from '@/data/friends'
import { findUserByIdOrUsername } from '@/data/profile'
import { useCurrentUser } from '@/providers/session-provider'

type State = { name: string; friends: Friend[]; hidden: boolean }

export default function FriendFriendsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const viewer = useCurrentUser()
  const [state, setState] = useState<State | null>(null)

  useEffect(() => {
    findUserByIdOrUsername(id)
      .then(async user => {
        if (!user || user.privacidade?.ocultarAmigos) {
          setState({ name: user?.nome ?? '', friends: [], hidden: true })
          return
        }
        setState({ name: user.nome, friends: await getFriends(user.id), hidden: false })
      })
      .catch(() => setState({ name: '', friends: [], hidden: false }))
  }, [id])

  if (!state) return <LoadingState />

  return (
    <ScreenScroll contentClassName="pt-2">
      <Stack.Screen options={{ title: state.name ? `Amigos de ${state.name.split(' ')[0]}` : 'Amigos' }} />
      {state.hidden ? (
        <Card><EmptyState icon={Lock} title="Lista de amigos privada" /></Card>
      ) : state.friends.length === 0 ? (
        <Card><EmptyState icon={UsersRound} title="Nenhum amigo adicionado ainda" /></Card>
      ) : (
        <Card className="overflow-hidden">
          {state.friends.map((friend, index) => (
            <View key={friend.friendshipId}>
              {index > 0 && <View className="h-px bg-border ml-[72px]" />}
              <UserRow
                user={friend.user}
                onPress={() => (friend.user.id === viewer.id
                  ? router.navigate('/profile')
                  : router.push({ pathname: '/friend/[id]', params: { id: friend.user.id } }))}
              />
            </View>
          ))}
        </Card>
      )}
    </ScreenScroll>
  )
}
