import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Bell, Box, Crown, ExternalLink, Headset, Lock, Mail, Palette, Shield, ShieldUser, Trash2, UserRound, Volume2 } from 'lucide-react-native'
import { Linking } from 'react-native'
import { ListRow, ListSection, SwitchRow } from '@/components/ui/list'
import { ScreenScroll } from '@/components/ui/screen'
import { updateUserFields } from '@/data/profile'
import { env } from '@/lib/env'
import { appVersion } from '@/lib/version'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'
import { useThemeColors } from '@/theme/colors'

export default function SettingsScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const toast = useToast()

  // O snapshot do perfil atualiza a tela assim que a escrita local acontece
  const toggle = (field: 'audioEnabled' | 'emailNotifications', value: boolean) => {
    updateUserFields(profile.id, { [field]: value }).catch(() => toast.error('Não foi possível salvar a preferência.'))
  }

  const externalIcon = <ExternalLink size={16} color={colors.subtle} />

  return (
    <ScreenScroll contentClassName="pt-2 gap-6">
      {!profile.isPremium && (
        <ListSection>
          <ListRow title="Seja Premium" description="Pagamento único, acesso vitalício" icon={Crown} iconColor={colors.premium} onPress={() => router.push('/premium')} />
        </ListSection>
      )}

      <ListSection title="Preferências">
        <ListRow title="Aparência" description="Tema claro, escuro e cor principal" icon={Palette} onPress={() => router.push('/settings/appearance')} />
        <SwitchRow
          title="Som no fim do descanso"
          description="Toca um bipe quando o timer termina"
          icon={Volume2}
          value={profile.audioEnabled === true}
          onValueChange={value => toggle('audioEnabled', value)}
        />
        <SwitchRow
          title="Resumo semanal por email"
          description="Seus treinos da semana, todo domingo"
          icon={Mail}
          value={profile.emailNotifications !== false}
          onValueChange={value => toggle('emailNotifications', value)}
        />
        <ListRow title="Notificações do aparelho" description="Permissões de push do Android" icon={Bell} onPress={() => Linking.openSettings()} />
      </ListSection>

      <ListSection title="Conta">
        <ListRow title="Privacidade do perfil" description="O que seus amigos podem ver" icon={Shield} onPress={() => router.push('/settings/privacy')} />
        <ListRow title="Alterar senha" icon={Lock} onPress={() => router.push('/settings/password')} />
        <ListRow title="Ajuda e suporte" description="Reportar um problema ou dar uma sugestão" icon={Headset} onPress={() => router.push('/settings/support')} />
      </ListSection>

      <ListSection title="Sobre">
        <ListRow title="Versão do app" icon={Box} value={appVersion} />
        <ListRow title="Política de privacidade" icon={ShieldUser} accessory={externalIcon} onPress={() => WebBrowser.openBrowserAsync(env.privacyPolicyUrl)} />
        <ListRow title="Desenvolvedor" description="Pedro Luca Prates" icon={UserRound} accessory={externalIcon} onPress={() => WebBrowser.openBrowserAsync(env.developerUrl)} />
        <ListRow title="Excluir minha conta" icon={Trash2} destructive accessory={externalIcon} onPress={() => WebBrowser.openBrowserAsync(env.deleteAccountUrl)} />
      </ListSection>
    </ScreenScroll>
  )
}
