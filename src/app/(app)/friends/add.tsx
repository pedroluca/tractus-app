import { router } from 'expo-router'
import { Check, Clock, Inbox, Search, UserPlus } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { ActivityIndicator, FlatList, TextInput, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/misc'
import { Text } from '@/components/ui/text'
import { UserRow } from '@/components/user-row'
import { getFriendshipStatus, getMyFriendships, searchUsers, sendFriendRequest, type Friendship } from '@/data/friends'
import type { UserProfile } from '@/data/types'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

export default function AddFriendScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()
  const insets = useSafeAreaInsets()

  const [term, setTerm] = useState('')
  const [search, setSearch] = useState<{ term: string; results: UserProfile[] }>({ term: '', results: [] })
  const [friendships, setFriendships] = useState<Friendship[]>([])
  const [sendingTo, setSendingTo] = useState<string | null>(null)

  useEffect(() => {
    getMyFriendships(profile.id).then(setFriendships).catch(() => {})
  }, [profile.id])

  const query = term.trim()
  const tooShort = query.length < 2
  const searching = !tooShort && search.term !== query
  const results = tooShort ? [] : search.results

  // Busca enquanto digita, com um pequeno atraso para não consultar a cada letra
  useEffect(() => {
    if (tooShort) return
    let active = true
    const timer = setTimeout(() => {
      searchUsers(query, profile.id)
        .catch(() => {
          toast.error('Erro ao buscar usuários.')
          return [] as UserProfile[]
        })
        .then(found => {
          if (active) setSearch({ term: query, results: found })
        })
    }, 300)
    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [query, tooShort, profile.id, toast])

  const send = async (user: UserProfile) => {
    setSendingTo(user.id)
    try {
      const friendship = await sendFriendRequest(profile, user.id)
      setFriendships(current => [...current, friendship])
      haptics.success()
      toast.success(`Solicitação enviada para ${user.nome.split(' ')[0]}`)
    } catch {
      toast.error('Não foi possível enviar a solicitação.')
    } finally {
      setSendingTo(null)
    }
  }

  const statusAccessory = (user: UserProfile) => {
    const status = getFriendshipStatus(friendships, profile.id, user.id)
    if (status === 'aceito') return <StatusTag icon={Check} label="Amigos" color={colors.primary} />
    if (status === 'enviado') return <StatusTag icon={Clock} label="Pendente" color={colors.muted} />
    if (status === 'recebido') {
      return <Button label="Responder" icon={Inbox} size="sm" variant="secondary" onPress={() => router.replace('/friends/requests')} />
    }
    return <Button label="Adicionar" icon={UserPlus} size="sm" loading={sendingTo === user.id} onPress={() => send(user)} />
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-4 pt-4 pb-3">
        <View className="flex-row items-center h-12 px-3.5 rounded-xl bg-surface-2 gap-2">
          <Search size={18} color={colors.subtle} />
          <TextInput
            value={term}
            onChangeText={setTerm}
            placeholder="Nome ou @username"
            placeholderTextColor={colors.subtle}
            className="flex-1 text-base text-foreground"
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {searching && <ActivityIndicator size="small" color={colors.primary} />}
        </View>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ItemSeparatorComponent={() => <View className="h-px bg-border ml-[72px]" />}
        ListEmptyComponent={
          tooShort ? (
            <EmptyState icon={Search} title="Encontre seus amigos" description="Digite pelo menos 2 letras do nome ou do username." />
          ) : searching ? null : (
            <Text tone="muted" className="text-center py-10">Ninguém encontrado com “{term}”.</Text>
          )
        }
        renderItem={({ item }) => (
          <UserRow
            user={item}
            onPress={() => router.push({ pathname: '/friend/[id]', params: { id: item.id } })}
            right={statusAccessory(item)}
          />
        )}
      />
    </View>
  )
}

function StatusTag({ icon: Icon, label, color }: { icon: typeof Check; label: string; color: string }) {
  return (
    <View className="flex-row items-center gap-1 px-2.5 h-8 rounded-full bg-surface-2">
      <Icon size={14} color={color} />
      <Text className="text-sm font-medium" style={{ color }}>{label}</Text>
    </View>
  )
}
