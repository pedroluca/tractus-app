import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { CalendarDays, Copy, Crown, Eye, Mail, MessageCircle, Palette, Sparkles, TrendingUp, type LucideIcon } from 'lucide-react-native'
import { useEffect, useState } from 'react'
import { Linking, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Callout } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { PREMIUM } from '@/data/content'
import { requestPremiumUpgrade } from '@/data/profile'
import { trackPremiumUpgradeModalOpened, trackPremiumUpgradeRequested } from '@/lib/analytics'
import { env } from '@/lib/env'
import { haptics } from '@/lib/haptics'
import { settle } from '@/lib/writes'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

const FEATURES: { icon: LucideIcon; title: string; description: string }[] = [
  { icon: CalendarDays, title: 'Calendário de streak', description: 'Seu histórico de treinos mês a mês, com as semanas da sequência em destaque.' },
  { icon: Palette, title: 'Cor do app', description: 'Escolha a cor principal do Tractus.' },
  { icon: TrendingUp, title: 'Métricas corporais', description: 'Histórico de peso e IMC com gráfico de evolução.' },
  { icon: Eye, title: 'Histórico dos amigos', description: 'Veja as atividades dos amigos além dos últimos 7 dias.' },
  { icon: Sparkles, title: 'Selo Premium', description: 'Selo e anel dourado no seu perfil, e acesso antecipado a novidades.' },
]

export default function PremiumScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()
  const [requested, setRequested] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    trackPremiumUpgradeModalOpened()
  }, [])

  const request = async () => {
    setLoading(true)
    try {
      await settle(requestPremiumUpgrade(profile))
      trackPremiumUpgradeRequested()
      haptics.success()
      setRequested(true)
    } catch {
      toast.error('Não foi possível enviar a solicitação. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  if (profile.isPremium) {
    return (
      <ScreenScroll contentClassName="pt-10 items-center gap-3">
        <View className="w-16 h-16 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.premium}1F` }}>
          <Crown size={30} color={colors.premium} />
        </View>
        <Text variant="title">Você já é Premium</Text>
        <Text tone="muted" className="text-center text-sm">Obrigado por apoiar o Tractus!</Text>
        <Button label="Fechar" onPress={() => router.back()} className="self-stretch mt-4" />
      </ScreenScroll>
    )
  }

  if (requested) {
    const whatsappText = encodeURIComponent(`Olá! Acabei de fazer o pagamento do Tractus Premium (${PREMIUM.price}). Segue o comprovante.`)
    const mailSubject = encodeURIComponent(`Comprovante Tractus Premium - ${profile.nome}`)
    const mailBody = encodeURIComponent(`Olá!\n\nAcabei de fazer o pagamento do Tractus Premium (${PREMIUM.price}).\n\nNome: ${profile.nome}\nEmail: ${profile.email}\n\nComprovante em anexo.`)

    return (
      <ScreenScroll contentClassName="pt-4 gap-5">
        <Callout tone="success" icon={Sparkles} title="Solicitação enviada">
          Agora é só fazer o PIX e mandar o comprovante. A liberação costuma sair em poucos minutos.
        </Callout>

        <Card className="p-4 gap-4">
          <View className="flex-row items-end justify-between">
            <View className="gap-0.5">
              <Text variant="caption" tone="muted">Valor</Text>
              <Text className="text-3xl font-bold">{PREMIUM.price}</Text>
            </View>
            <Text variant="caption" tone="subtle">pagamento único</Text>
          </View>
          <View className="h-px bg-border" />
          <View className="gap-1">
            <Text variant="caption" tone="muted">Chave PIX (email)</Text>
            <View className="flex-row items-center gap-2">
              <Text selectable className="flex-1 text-base font-semibold">{PREMIUM.pixKey}</Text>
              <Button
                label="Copiar"
                icon={Copy}
                variant="secondary"
                size="sm"
                onPress={async () => {
                  await Clipboard.setStringAsync(PREMIUM.pixKey)
                  haptics.success()
                  toast.success('Chave PIX copiada')
                }}
              />
            </View>
          </View>
          <View className="items-center gap-2">
            <Image source={require('@/assets/images/qr-code-premium.jpg')} style={{ width: 180, height: 180, borderRadius: 12 }} contentFit="contain" accessibilityLabel="QR Code PIX" />
            <Text variant="caption" tone="subtle" className="text-center">No app do banco: PIX → Ler QR Code, ou use a chave acima.</Text>
          </View>
        </Card>

        <View className="gap-2">
          <Text variant="subheading">Envie o comprovante</Text>
          <Button label="Enviar pelo WhatsApp" icon={MessageCircle} size="lg" onPress={() => Linking.openURL(`https://wa.me/${PREMIUM.whatsapp}?text=${whatsappText}`)} />
          <Button label="Enviar por email" icon={Mail} variant="secondary" size="lg" onPress={() => Linking.openURL(`mailto:${env.supportEmail}?subject=${mailSubject}&body=${mailBody}`)} />
        </View>
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      <View className="items-center gap-3 pt-2">
        <View className="w-16 h-16 rounded-2xl items-center justify-center" style={{ backgroundColor: `${colors.premium}1F` }}>
          <Crown size={30} color={colors.premium} />
        </View>
        <Text variant="title" className="text-center">Tractus Premium</Text>
        <Text tone="muted" className="text-center text-sm leading-5 px-4">Recursos extras para quem leva a consistência a sério, e uma forma de apoiar o app.</Text>
      </View>

      <Card className="p-4 gap-4">
        {FEATURES.map(({ icon: Icon, title, description }) => (
          <View key={title} className="flex-row gap-3.5">
            <View className="w-10 h-10 rounded-xl items-center justify-center" style={{ backgroundColor: `${colors.premium}1A` }}>
              <Icon size={20} color={colors.premium} />
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="text-base font-semibold">{title}</Text>
              <Text tone="muted" className="text-sm leading-5">{description}</Text>
            </View>
          </View>
        ))}
      </Card>

      <Card className="p-4 flex-row items-center justify-between">
        <View className="gap-0.5">
          <Text className="text-2xl font-bold">{PREMIUM.price}</Text>
          <Text variant="caption" tone="muted">Pagamento único via PIX · acesso vitalício</Text>
        </View>
      </Card>

      <View className="gap-2">
        <Button label="Quero ser Premium" icon={Crown} size="lg" loading={loading} onPress={request} />
        <Button label="Agora não" variant="ghost" onPress={() => router.back()} />
      </View>
    </ScreenScroll>
  )
}
