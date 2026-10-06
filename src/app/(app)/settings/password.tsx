import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from '@react-native-firebase/auth'
import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { TextField } from '@/components/ui/text-field'
import { auth } from '@/lib/firebase'
import { haptics } from '@/lib/haptics'
import { useToast } from '@/providers/toast-provider'

export default function ChangePasswordScreen() {
  const toast = useToast()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    setError(null)
    if (!current || !next || !confirm) return setError('Preencha todos os campos.')
    if (next.length < 6) return setError('A nova senha precisa ter pelo menos 6 caracteres.')
    if (next !== confirm) return setError('As senhas novas não coincidem.')
    if (next === current) return setError('A nova senha precisa ser diferente da atual.')

    const user = auth.currentUser
    if (!user?.email) return setError('Sessão expirada. Entre novamente.')

    setLoading(true)
    try {
      await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, current))
      await updatePassword(user, next)
      haptics.success()
      toast.success('Senha alterada')
      router.back()
    } catch (err) {
      const code = (err as { code?: string }).code
      setError(
        code === 'auth/wrong-password' || code === 'auth/invalid-credential' ? 'A senha atual está incorreta.'
          : code === 'auth/too-many-requests' ? 'Muitas tentativas. Tente novamente mais tarde.'
            : 'Não foi possível alterar a senha. Tente novamente.',
      )
      setLoading(false)
    }
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      {error && <Callout tone="danger">{error}</Callout>}
      <View className="gap-4">
        <TextField label="Senha atual" value={current} onChangeText={setCurrent} secureToggle autoComplete="current-password" />
        <TextField label="Nova senha" value={next} onChangeText={setNext} secureToggle autoComplete="new-password" hint="Mínimo de 6 caracteres" />
        <TextField label="Confirmar nova senha" value={confirm} onChangeText={setConfirm} secureToggle autoComplete="new-password" returnKeyType="done" onSubmitEditing={submit} />
      </View>
      <Button label="Alterar senha" size="lg" loading={loading} onPress={submit} />
    </ScreenScroll>
  )
}
