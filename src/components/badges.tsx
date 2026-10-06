import { router, type Href } from 'expo-router'
import { ChevronRight, Crown } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, ScrollView, View } from 'react-native'
import type { BadgeDefinition, BadgeTone } from '@/data/badges'
import { haptics } from '@/lib/haptics'
import { useThemeColors, type ThemeColors } from '@/theme/colors'
import { Button } from './ui/button'
import { Sheet } from './ui/sheet'
import { Text } from './ui/text'

export const badgeColor = (tone: BadgeTone, colors: ThemeColors) => ({
  founder: colors.founder,
  premium: colors.premium,
  info: colors.info,
  success: colors.success,
  streak: colors.streak,
})[tone]

function BadgeIcon({ badge, size = 40 }: { badge: BadgeDefinition; size?: number }) {
  const colors = useThemeColors()
  const color = badgeColor(badge.tone, colors)
  const { Icon } = badge
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: `${color}1F`, borderColor: `${color}66` }} className="items-center justify-center border">
      <Icon size={size * 0.45} color={color} strokeWidth={2.4} />
    </View>
  )
}

function BadgeDetailSheet({ badge, onClose, showUpgrade }: { badge: BadgeDefinition | null; onClose: () => void; showUpgrade: boolean }) {
  return (
    <Sheet visible={!!badge} onClose={onClose}>
      {badge && (
        <View className="items-center gap-3 pt-2 pb-3">
          <BadgeIcon badge={badge} size={64} />
          <Text variant="heading" className="text-center">{badge.title}</Text>
          <Text tone="muted" className="text-center text-sm leading-5 px-2">{badge.description}</Text>
          {showUpgrade && badge.id === 'premium' && (
            <Button
              label="Quero ser Premium"
              icon={Crown}
              variant="secondary"
              className="mt-2"
              onPress={() => {
                onClose()
                setTimeout(() => router.push('/premium'), 200)
              }}
            />
          )}
        </View>
      )}
    </Sheet>
  )
}

/** Fileira de badges do perfil; tocar abre o detalhe */
export function BadgeStrip({ badges, viewAllHref, viewerIsPremium }: { badges: BadgeDefinition[]; viewAllHref?: Href; viewerIsPremium: boolean }) {
  const colors = useThemeColors()
  const [active, setActive] = useState<BadgeDefinition | null>(null)
  if (badges.length === 0) return null

  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2 items-center">
        {badges.map(badge => (
          <Pressable
            key={badge.id}
            accessibilityRole="button"
            accessibilityLabel={badge.title}
            onPress={() => {
              haptics.selection()
              setActive(badge)
            }}
          >
            <BadgeIcon badge={badge} size={36} />
          </Pressable>
        ))}
        {viewAllHref && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Ver todas as conquistas"
            onPress={() => router.push(viewAllHref)}
            className="w-9 h-9 rounded-full bg-surface-2 items-center justify-center active:bg-surface-3"
          >
            <ChevronRight size={18} color={colors.muted} />
          </Pressable>
        )}
      </ScrollView>
      <BadgeDetailSheet badge={active} onClose={() => setActive(null)} showUpgrade={!viewerIsPremium} />
    </>
  )
}

/** Lista completa (tela de conquistas) */
export function BadgeList({ badges, viewerIsPremium }: { badges: BadgeDefinition[]; viewerIsPremium: boolean }) {
  return (
    <View className="bg-surface rounded-2xl border border-border overflow-hidden">
      {badges.map((badge, index) => (
        <View key={badge.id}>
          {index > 0 && <View className="h-px bg-border ml-[72px]" />}
          <View className="flex-row items-center gap-4 px-4 py-3.5">
            <BadgeIcon badge={badge} size={44} />
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold">{badge.title}</Text>
              <Text variant="caption" tone="muted" className="leading-4">{badge.description}</Text>
              {!viewerIsPremium && badge.id === 'premium' && (
                <Pressable onPress={() => router.push('/premium')} className="self-start mt-1">
                  <Text className="text-xs font-semibold text-premium">Quero ser Premium também</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      ))}
    </View>
  )
}
