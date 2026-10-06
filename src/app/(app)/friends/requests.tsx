import { router } from 'expo-router'
import { Check, Inbox, X } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { View } from 'react-native'
import { Card } from '@/components/ui/card'
import { IconButton } from '@/components/ui/icon-button'
import { EmptyState, LoadingState } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { UserRow } from '@/components/user-row'
import { acceptFriendRequest, getPendingRequests, removeFriendship, type FriendRequest } from '@/data/friends'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'

export default function FriendRequestsScreen() {
  const profile = useCurrentUser()
  const toast = useToast()
  const [requests, setRequests] = useState<FriendRequest[] | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  useEffect(() => {
    getPendingRequests(profile.id).then(setRequests).catch(() => setRequests([]))
  }, [profile.id])

  const respond = async (request: FriendRequest, accept: boolean) => {
    setBusyId(request.id)
    try {
      if (accept) await acceptFriendRequest(request.id)
      else await removeFriendship(request.id)
      if (accept) {
        haptics.success()
        toast.success(`Você e ${request.requester.nome.split(' ')[0]} agora são amigos`)
      }
      setRequests(current => current?.filter(item => item.id !== request.id) ?? null)
    } catch {
      toast.error('Não foi possível responder a solicitação.')
    } finally {
      setBusyId(null)
    }
  }

  if (!requests) return <LoadingState />

  return (
    <ScreenScroll contentClassName="pt-4">
      {requests.length === 0 ? (
        <Card>
          <EmptyState icon={Inbox} title="Nenhuma solicitação pendente" description="Quando alguém te adicionar, a solicitação aparece aqui." />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {requests.map((request, index) => (
            <View key={request.id}>
              {index > 0 && <View className="h-px bg-border ml-[72px]" />}
              <UserRow
                user={request.requester}
                onPress={() => router.push({ pathname: '/friend/[id]', params: { id: request.requester.id } })}
                right={(
                  <View className="flex-row gap-2">
                    <IconButton icon={X} variant="surface" accessibilityLabel="Recusar" disabled={busyId === request.id} onPress={() => respond(request, false)} />
                    <IconButton icon={Check} variant="primary" accessibilityLabel="Aceitar" disabled={busyId === request.id} onPress={() => respond(request, true)} />
                  </View>
                )}
              />
            </View>
          ))}
        </Card>
      )}
    </ScreenScroll>
  )
}
