import { Activity, AtSign, Cake, Dumbbell, Flame, Mail, Ruler, Scale, UsersRound, type LucideIcon } from 'lucide-react-native'
import { ListSection, SwitchRow } from '@/components/ui/list'
import { ScreenScroll } from '@/components/ui/screen'
import { savePrivacy } from '@/data/profile'
import type { Privacidade } from '@/data/types'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'

type PrivacyKey = keyof Privacidade

const PROFILE_ITEMS: { key: PrivacyKey; label: string; icon: LucideIcon }[] = [
  { key: 'ocultarEmail', label: 'Ocultar email', icon: Mail },
  { key: 'ocultarNascimento', label: 'Ocultar data de nascimento', icon: Cake },
  { key: 'ocultarInstagram', label: 'Ocultar Instagram', icon: AtSign },
  { key: 'ocultarPeso', label: 'Ocultar peso', icon: Scale },
  { key: 'ocultarAltura', label: 'Ocultar altura', icon: Ruler },
]

const ACTIVITY_ITEMS: { key: PrivacyKey; label: string; description: string; icon: LucideIcon }[] = [
  { key: 'ocultarAmigos', label: 'Ocultar lista de amigos', description: 'Ninguém vê quem você adicionou', icon: UsersRound },
  { key: 'ocultarStreak', label: 'Ocultar sequência', description: 'Esconde suas semanas seguidas', icon: Flame },
  { key: 'ocultarAtividades', label: 'Ocultar atividades', description: 'Esconde seu histórico de exercícios', icon: Activity },
  { key: 'ocultarTreinos', label: 'Ocultar treinos', description: 'Esconde suas rotinas de exercícios', icon: Dumbbell },
]

export default function PrivacyScreen() {
  const profile = useCurrentUser()
  const toast = useToast()
  // Email começa oculto por padrão (mesma regra do web)
  const privacy: Privacidade = { ocultarEmail: true, ...profile.privacidade }

  const toggle = (key: PrivacyKey, value: boolean) => {
    savePrivacy(profile.id, { ...privacy, [key]: value }).catch(() => toast.error('Não foi possível salvar a preferência.'))
  }

  return (
    <ScreenScroll contentClassName="pt-2 gap-6">
      <ListSection title="Informações do perfil">
        {PROFILE_ITEMS.map(item => (
          <SwitchRow key={item.key} title={item.label} icon={item.icon} value={!!privacy[item.key]} onValueChange={value => toggle(item.key, value)} />
        ))}
      </ListSection>
      <ListSection title="Atividade" footer="Essas opções valem para todos que visitam seu perfil, inclusive amigos e treinadores.">
        {ACTIVITY_ITEMS.map(item => (
          <SwitchRow key={item.key} title={item.label} description={item.description} icon={item.icon} value={!!privacy[item.key]} onValueChange={value => toggle(item.key, value)} />
        ))}
      </ListSection>
    </ScreenScroll>
  )
}
