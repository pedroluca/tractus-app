import { useLocalSearchParams } from 'expo-router'
import { Award } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { BadgeList } from '@/components/badges'
import { Card } from '@/components/ui/card'
import { EmptyState, LoadingState } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { resolveUserBadges, type BadgeDefinition } from '@/data/badges'
import { findUserByIdOrUsername } from '@/data/profile'
import { useCurrentUser } from '@/providers/session-provider'

export default function FriendBadgesScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const viewer = useCurrentUser()
  const [badges, setBadges] = useState<BadgeDefinition[] | null>(null)

  useEffect(() => {
    findUserByIdOrUsername(id).then(user => setBadges(user ? resolveUserBadges(user) : [])).catch(() => setBadges([]))
  }, [id])

  if (!badges) return <LoadingState />

  return (
    <ScreenScroll contentClassName="pt-2">
      {badges.length === 0 ? (
        <Card><EmptyState icon={Award} title="Nenhuma conquista por aqui ainda" /></Card>
      ) : (
        <BadgeList badges={badges} viewerIsPremium={!!viewer.isPremium} />
      )}
    </ScreenScroll>
  )
}
