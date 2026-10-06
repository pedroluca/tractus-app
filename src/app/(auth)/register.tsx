import { createUserWithEmailAndPassword } from '@react-native-firebase/auth'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { Check } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { SwitchRow, ListSection } from '@/components/ui/list'
import { Callout } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { createUserProfile, isEmailRegistered } from '@/data/profile'
import { trackSignUp } from '@/lib/analytics'
import { cn } from '@/lib/cn'
import { env } from '@/lib/env'
import { auth } from '@/lib/firebase'
import { connectPushUser } from '@/lib/push'
import { useThemeColors } from '@/theme/colors'

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** Máscara de telefone brasileiro: (99) 99999-9999 */
function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits.length ? `(${digits}` : ''
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

export default function RegisterScreen() {
  const colors = useThemeColors()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [emailInUse, setEmailInUse] = useState(false)
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isTrainer, setIsTrainer] = useState(false)
  const [cref, setCref] = useState('')
  const [acceptedTerms, setAcceptedTerms] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const checkEmail = async () => {
    const trimmed = email.trim().toLowerCase()
    if (!EMAIL_REGEX.test(trimmed)) return
    setEmailInUse(await isEmailRegistered(trimmed).catch(() => false))
  }

  const validate = (): string | null => {
    if (!name.trim()) return 'Digite seu nome.'
    if (!EMAIL_REGEX.test(email.trim())) return 'Digite um email válido.'
    if (emailInUse) return 'Este email já está cadastrado. Faça login ou use outro email.'
    if (phone.replace(/\D/g, '').length !== 11) return 'Digite um telefone válido com DDD.'
    if (password.length < 6) return 'A senha precisa ter pelo menos 6 caracteres.'
    if (password !== confirmPassword) return 'As senhas não coincidem.'
    if (!acceptedTerms) return 'Você precisa aceitar a Política de Privacidade para continuar.'
    return null
  }

  const handleSubmit = async () => {
    const validationError = validate()
    if (validationError) {
      setError(validationError)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password)
      await createUserProfile({ uid: credential.user.uid, name, email, phone, isTrainer, cref })
      trackSignUp()
      // O vínculo do push feito no login pode ter rodado antes do perfil existir
      connectPushUser(credential.user.uid).catch(() => {})
      // Com o perfil criado o usuário já entra logado no app
    } catch (err) {
      const code = (err as { code?: string }).code
      setError(
        code === 'auth/email-already-in-use' ? 'Este email já está cadastrado. Faça login ou use outro email.'
          : code === 'auth/invalid-email' ? 'Email inválido.'
            : code === 'auth/weak-password' ? 'Senha muito fraca. Use pelo menos 6 caracteres.'
              : 'Não foi possível criar a conta. Tente novamente.',
      )
      setLoading(false)
    }
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-6">
      <View className="gap-1.5">
        <Text variant="display">Criar conta</Text>
        <Text tone="muted">Leva menos de um minuto e é grátis.</Text>
      </View>

      <View className="gap-4">
        <TextField label="Nome completo" value={name} onChangeText={setName} placeholder="Como você quer ser chamado" autoComplete="name" autoCapitalize="words" />
        <TextField
          label="Email"
          value={email}
          onChangeText={value => {
            setEmail(value)
            setEmailInUse(false)
          }}
          onBlur={checkEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={emailInUse ? 'Este email já está cadastrado.' : null}
        />
        <TextField label="Telefone (WhatsApp)" value={phone} onChangeText={value => setPhone(formatPhone(value))} placeholder="(11) 91234-5678" keyboardType="phone-pad" autoComplete="tel" />
        <TextField label="Senha" value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" secureToggle autoComplete="new-password" />
        <TextField label="Confirmar senha" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Repita a senha" secureToggle autoComplete="new-password" />
      </View>

      <ListSection footer="Treinadores podem montar e acompanhar os treinos dos alunos vinculados.">
        <SwitchRow title="Sou personal trainer" value={isTrainer} onValueChange={setIsTrainer} />
      </ListSection>
      {isTrainer && (
        <TextField label="CREF (opcional)" value={cref} onChangeText={value => setCref(value.toUpperCase())} placeholder="Ex.: 123456-G/SP" autoCapitalize="characters" maxLength={30} />
      )}

      <Pressable accessibilityRole="checkbox" accessibilityState={{ checked: acceptedTerms }} onPress={() => setAcceptedTerms(value => !value)} className="flex-row items-start gap-3">
        <View className={cn('w-6 h-6 rounded-md border-2 items-center justify-center mt-0.5', acceptedTerms ? 'bg-primary border-primary' : 'border-border')}>
          {acceptedTerms && <Check size={16} color={colors.onPrimary} strokeWidth={3} />}
        </View>
        <Text tone="muted" className="flex-1 text-sm leading-5">
          Li e aceito a{' '}
          <Text className="text-sm text-primary font-semibold" onPress={() => WebBrowser.openBrowserAsync(env.privacyPolicyUrl)}>
            Política de Privacidade
          </Text>
          {' '}do Tractus.
        </Text>
      </Pressable>

      {error && <Callout tone="danger">{error}</Callout>}

      <View className="gap-3">
        <Button label="Criar conta" size="lg" loading={loading} onPress={handleSubmit} />
        <Button label="Já tenho conta" variant="outline" size="lg" onPress={() => router.replace('/login')} disabled={loading} />
      </View>
    </ScreenScroll>
  )
}
