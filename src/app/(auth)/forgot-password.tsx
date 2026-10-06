import { sendPasswordResetEmail } from '@react-native-firebase/auth'
import { router, useLocalSearchParams } from 'expo-router'
import { MailCheck } from 'lucide-react-native'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { auth } from '@/lib/firebase'

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>()
  const [email, setEmail] = useState(params.email ?? '')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSend = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Digite um email válido.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await sendPasswordResetEmail(auth, email.trim())
      setSent(true)
    } catch {
      setError('Não foi possível enviar o email. Confira se o endereço está correto.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-6">
      <View className="gap-1.5">
        <Text variant="display">Recuperar senha</Text>
        <Text tone="muted">Enviaremos um link para você criar uma nova senha.</Text>
      </View>

      {sent ? (
        <View className="gap-4">
          <Callout tone="success" icon={MailCheck} title="Email enviado">
            Confira sua caixa de entrada (e o spam) e siga o link para redefinir a senha.
          </Callout>
          <Button label="Voltar para o login" size="lg" onPress={() => router.back()} />
        </View>
      ) : (
        <View className="gap-4">
          {error && <Callout tone="danger">{error}</Callout>}
          <TextField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="voce@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            returnKeyType="send"
            onSubmitEditing={handleSend}
          />
          <Button label="Enviar link" size="lg" loading={loading} onPress={handleSend} />
        </View>
      )}
    </ScreenScroll>
  )
}
