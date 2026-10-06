import { Image } from 'expo-image'
import { useState } from 'react'
import { View } from 'react-native'
import type { BadgeTone } from '@/data/badges'
import { useThemeColors } from '@/theme/colors'
import { Text } from './text'

type AvatarProps = {
  name?: string
  uri?: string | null
  size?: number
  /** Anel colorido para badges especiais (fundador, premium) */
  ring?: BadgeTone | null
}

/** Foto do usuário com fallback para a inicial quando não há foto ou a URL quebrou */
export function Avatar({ name, uri, size = 48, ring }: AvatarProps) {
  const colors = useThemeColors()
  const [failedUri, setFailedUri] = useState<string | null>(null)
  const showImage = !!uri && failedUri !== uri
  const initial = name?.trim().charAt(0).toUpperCase() || '?'

  const ringColor = ring === 'founder' ? colors.founder : ring === 'premium' ? colors.premium : null
  const ringWidth = size >= 72 ? 3 : 2
  const outer = ringColor ? size + ringWidth * 2 + 4 : size

  return (
    <View
      style={{
        width: outer,
        height: outer,
        borderRadius: outer / 2,
        borderWidth: ringColor ? ringWidth : 0,
        borderColor: ringColor ?? 'transparent',
      }}
      className="items-center justify-center"
    >
      <View style={{ width: size, height: size, borderRadius: size / 2 }} className="bg-primary overflow-hidden items-center justify-center">
        {showImage ? (
          <Image
            source={{ uri }}
            style={{ width: size, height: size }}
            contentFit="cover"
            transition={150}
            onError={() => setFailedUri(uri ?? null)}
            accessibilityLabel={name ? `Foto de ${name}` : 'Foto de perfil'}
          />
        ) : (
          <Text className="font-bold text-on-primary" style={{ fontSize: size * 0.42 }}>{initial}</Text>
        )}
      </View>
    </View>
  )
}
