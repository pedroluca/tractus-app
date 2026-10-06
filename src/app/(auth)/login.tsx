import { router } from 'expo-router'
import { useRef, useState } from 'react'
import { TextInput, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/misc'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { SignInError, useSession } from '@/providers/session-provider'

export default function LoginScreen() {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      setError('Informe seu email e sua senha.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      await signIn(email, password)
      // A navegação para o app acontece sozinha quando o perfil carrega (Stack.Protected)
    } catch (err) {
      setError(err instanceof SignInError ? err.message : 'Email ou senha incorretos. Confira e tente de novo.')
      setLoading(false)
    }
  }

  return (
    <ScreenScroll bottomInset contentClassName="pt-4 gap-6">
      <View className="gap-1.5">
        <Text variant="display">Entrar</Text>
        <Text tone="muted">Bom te ver de volta. Faça login para continuar seus treinos.</Text>
      </View>

      {error && <Callout tone="danger">{error}</Callout>}

      <View className="gap-4">
        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          placeholder="voce@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />
        <TextField
          ref={passwordRef}
          label="Senha"
          value={password}
          onChangeText={setPassword}
          placeholder="Sua senha"
          secureToggle
          autoComplete="password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={handleSubmit}
        />
        <Button label="Esqueci minha senha" variant="ghost" size="sm" className="self-end -mr-2" onPress={() => router.push({ pathname: '/forgot-password', params: { email } })} />
      </View>

      <View className="gap-3">
        <Button label="Entrar" size="lg" loading={loading} onPress={handleSubmit} />
        <Button label="Ainda não tenho conta" variant="outline" size="lg" onPress={() => router.replace('/register')} disabled={loading} />
      </View>
    </ScreenScroll>
  )
}
