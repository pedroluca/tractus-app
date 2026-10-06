import { Image } from 'expo-image'
import { router } from 'expo-router'
import { CalendarCheck, Flame, LineChart, UsersRound, type LucideIcon } from 'lucide-react-native'
import { View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button } from '@/components/ui/button'
import { Text } from '@/components/ui/text'
import { appVersion } from '@/lib/version'
import { useThemeColors } from '@/theme/colors'

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: CalendarCheck, title: 'Treinos por dia da semana', description: 'Monte sua rotina e marque cada série na hora.' },
  { icon: Flame, title: 'Streak semanal', description: 'Mantenha a consistência treinando toda semana.' },
  { icon: LineChart, title: 'Evolução de carga', description: 'Veja seu progresso em cada exercício.' },
  { icon: UsersRound, title: 'Amigos e treinadores', description: 'Treine junto e receba treinos do seu personal.' },
]

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets()
  const colors = useThemeColors()

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }}>
      <View className="flex-1 w-full max-w-md self-center px-6 justify-between">
        <View className="gap-8">
          <View className="gap-4">
            <Image source={require('@/assets/images/brand/logo-green-bg.png')} style={{ width: 64, height: 64 }} accessibilityLabel="Logo do Tractus" />
            <View className="gap-2">
              <Text variant="display">Tractus</Text>
              <Text tone="muted" className="text-base leading-6">
                Organize seus treinos, registre cada série e acompanhe sua evolução.
              </Text>
            </View>
          </View>

          <View className="gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <View key={title} className="flex-row gap-4 items-start">
                <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
                  <Icon size={20} color={colors.primary} />
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-base font-semibold">{title}</Text>
                  <Text tone="muted" className="text-sm leading-5">{description}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        <View className="gap-3">
          <Button label="Entrar" size="lg" onPress={() => router.push('/login')} />
          <Button label="Criar conta grátis" size="lg" variant="secondary" onPress={() => router.push('/register')} />
          <Text variant="caption" tone="subtle" className="text-center mt-2">v{appVersion}</Text>
        </View>
      </View>
    </View>
  )
}
