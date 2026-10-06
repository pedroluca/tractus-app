import { Award } from 'lucide-react-native'
import { useMemo } from 'react'
import { BadgeList } from '@/components/badges'
import { Card } from '@/components/ui/card'
import { EmptyState } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { resolveUserBadges, STREAK_MILESTONE_WEEKS } from '@/data/badges'
import { useCurrentUser } from '@/providers/session-provider'

export default function MyBadgesScreen() {
  const profile = useCurrentUser()
  const badges = useMemo(() => resolveUserBadges(profile), [profile])

  return (
    <ScreenScroll contentClassName="pt-2">
      {badges.length === 0 ? (
        <Card>
          <EmptyState
            icon={Award}
            title="Nenhuma conquista ainda"
            description={`Treine ${STREAK_MILESTONE_WEEKS} semanas seguidas para ganhar sua primeira conquista de streak.`}
          />
        </Card>
      ) : (
        <BadgeList badges={badges} viewerIsPremium={!!profile.isPremium} />
      )}
      <Text variant="caption" tone="subtle" className="text-center px-4">
        Conquistas de streak são liberadas a cada {STREAK_MILESTONE_WEEKS} semanas seguidas de treino.
      </Text>
    </ScreenScroll>
  )
}
