import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { resolveAvatarTone, resolveUserBadges } from '@/data/badges'
import type { UserProfile } from '@/data/types'
import { cn } from '@/lib/cn'
import { Avatar } from './ui/avatar'
import { Text } from './ui/text'

type UserRowProps = {
  user: Pick<UserProfile, 'nome' | 'username' | 'photoURL' | 'isTrainer' | 'isFounder' | 'isPremium' | 'badges'>
  onPress?: () => void
  right?: ReactNode
  subtitle?: string
  className?: string
}

/** Linha de usuário (amigos, solicitações, alunos) */
export function UserRow({ user, onPress, right, subtitle, className }: UserRowProps) {
  const ring = resolveAvatarTone(resolveUserBadges(user))
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      className={cn('flex-row items-center gap-3 px-4 py-3', onPress && 'active:bg-surface-2', className)}
    >
      <Avatar name={user.nome} uri={user.photoURL} size={44} ring={ring} />
      <View className="flex-1 gap-0.5">
        <Text className="text-base font-semibold" numberOfLines={1}>{user.nome}</Text>
        <View className="flex-row items-center gap-2">
          {(subtitle || user.username) && (
            <Text variant="caption" tone="muted" numberOfLines={1} className="flex-shrink">
              {subtitle ?? `@${user.username}`}
            </Text>
          )}
          {user.isTrainer && (
            <View className="px-1.5 py-0.5 rounded-md bg-info/10">
              <Text className="text-[10px] font-semibold text-info">TREINADOR</Text>
            </View>
          )}
        </View>
      </View>
      {right}
    </Pressable>
  )
}
