import { router } from 'expo-router'
import { useState } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { ListSection, SwitchRow } from '@/components/ui/list'
import { Callout } from '@/components/ui/misc'
import { DateField } from '@/components/ui/picker-sheet'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { saveProfile, UsernameTakenError } from '@/data/profile'
import { getLocalDateKey, parseDateKey } from '@/lib/dates'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useToast } from '@/providers/toast-provider'

const BIO_LIMIT = 160

export default function EditProfileScreen() {
  const profile = useCurrentUser()
  const toast = useToast()
  const [nome, setNome] = useState(profile.nome ?? '')
  const [username, setUsername] = useState(profile.username ?? '')
  const [bio, setBio] = useState(profile.bio ?? '')
  const [birthDate, setBirthDate] = useState<Date | null>(profile.dataNascimento ? parseDateKey(profile.dataNascimento) : null)
  const [instagram, setInstagram] = useState(profile.instagram ?? '')
  const [isTrainer, setIsTrainer] = useState(!!profile.isTrainer)
  const [cref, setCref] = useState(profile.cref ?? '')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const save = async () => {
    if (!nome.trim()) {
      setError('O nome não pode ficar vazio.')
      return
    }
    if (username && !/^[a-zA-Z0-9._]{3,30}$/.test(username.replace(/^@/, ''))) {
      setError('O username deve ter de 3 a 30 caracteres: letras, números, ponto ou _.')
      return
    }
    setSaving(true)
    setError(null)
    try {
      await saveProfile(profile, {
        nome,
        username,
        bio,
        dataNascimento: birthDate ? getLocalDateKey(birthDate) : '',
        instagram,
        isTrainer,
        cref,
      })
      haptics.success()
      toast.success('Perfil atualizado')
      router.back()
    } catch (err) {
      setError(err instanceof UsernameTakenError ? err.message : 'Não foi possível salvar. Verifique sua conexão.')
      setSaving(false)
    }
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      {error && <Callout tone="danger">{error}</Callout>}

      <TextField label="Nome" value={nome} onChangeText={setNome} placeholder="Seu nome" autoCapitalize="words" maxLength={80} />
      <TextField
        label="Username"
        value={username}
        onChangeText={value => setUsername(value.replace(/^@/, '').replace(/\s/g, ''))}
        prefix="@"
        placeholder="seu_username"
        autoCapitalize="none"
        autoCorrect={false}
        hint="Seus amigos te encontram por ele."
        maxLength={30}
      />
      <View className="gap-1.5">
        <TextField label="Bio" value={bio} onChangeText={setBio} placeholder="Conte um pouco sobre você e seus objetivos" multiline maxLength={BIO_LIMIT} />
        <Text variant="caption" tone="subtle" className="text-right">{bio.length}/{BIO_LIMIT}</Text>
      </View>
      <DateField label="Data de nascimento" value={birthDate} onChange={setBirthDate} maximumDate={new Date()} minimumDate={new Date(1920, 0, 1)} />
      <TextField
        label="Instagram"
        value={instagram}
        onChangeText={value => setInstagram(value.replace(/^@/, '').replace(/\s/g, ''))}
        prefix="@"
        placeholder="seu_instagram"
        autoCapitalize="none"
        autoCorrect={false}
      />

      <ListSection footer="Treinadores podem montar e acompanhar os treinos de alunos vinculados.">
        <SwitchRow title="Perfil de treinador" value={isTrainer} onValueChange={setIsTrainer} />
      </ListSection>
      {isTrainer && (
        <TextField label="CREF (opcional)" value={cref} onChangeText={value => setCref(value.toUpperCase())} placeholder="Ex.: 123456-G/SP" autoCapitalize="characters" maxLength={30} />
      )}

      <Button label="Salvar" size="lg" loading={saving} onPress={save} />
    </ScreenScroll>
  )
}
