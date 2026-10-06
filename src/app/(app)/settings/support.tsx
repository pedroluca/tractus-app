import { Image } from 'expo-image'
import { router } from 'expo-router'
import { CircleCheck, ImagePlus, X } from 'lucide-react-native'
import { useState } from 'react'
import { Pressable, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Callout } from '@/components/ui/misc'
import { SelectField } from '@/components/ui/picker-sheet'
import { ScreenScroll } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { TextField } from '@/components/ui/text-field'
import { sendSupportReport } from '@/data/profile'
import { uploadImage } from '@/lib/api'
import { haptics } from '@/lib/haptics'
import { pickImage } from '@/lib/image'
import { settle } from '@/lib/writes'
import { useCurrentUser } from '@/providers/session-provider'
import { useThemeColors } from '@/theme/colors'

type ReportType = 'Bug' | 'Sugestão' | 'Erro' | 'Outro'

const TYPES: { value: ReportType; label: string; description: string }[] = [
  { value: 'Bug', label: 'Reportar um bug', description: 'Algo não funciona como deveria' },
  { value: 'Sugestão', label: 'Dar uma sugestão', description: 'Uma ideia para melhorar o app' },
  { value: 'Erro', label: 'Erro no aplicativo', description: 'Uma mensagem de erro ou travamento' },
  { value: 'Outro', label: 'Outro assunto', description: 'Dúvidas e qualquer outra coisa' },
]

export default function SupportScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const [type, setType] = useState<ReportType>('Bug')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const attach = async () => {
    try {
      const uri = await pickImage({ square: false, maxSize: 1600 })
      if (uri) setImageUri(uri)
    } catch {
      setError('Permita o acesso às fotos para anexar um print.')
    }
  }

  const submit = async () => {
    if (!title.trim() || !message.trim()) {
      setError('Preencha o título e a mensagem.')
      return
    }
    setSending(true)
    setError(null)
    try {
      const imagemUrl = imageUri ? await uploadImage(imageUri, profile.id, 'bug-report') : null
      await settle(sendSupportReport(profile, { tipo: type, titulo: title, mensagem: message, imagemUrl }))
      haptics.success()
      setSent(true)
    } catch {
      setError('Não foi possível enviar seu relato. Verifique a conexão e tente de novo.')
      setSending(false)
    }
  }

  if (sent) {
    return (
      <ScreenScroll contentClassName="pt-10 items-center gap-4">
        <CircleCheck size={56} color={colors.primary} />
        <Text variant="title" className="text-center">Relato enviado</Text>
        <Text tone="muted" className="text-center text-sm leading-5 px-6">Obrigado por ajudar a melhorar o Tractus. Vamos analisar em breve.</Text>
        <Button label="Voltar" onPress={() => router.back()} className="self-stretch mt-4" />
      </ScreenScroll>
    )
  }

  return (
    <ScreenScroll contentClassName="pt-4 gap-5">
      {error && <Callout tone="danger">{error}</Callout>}
      <SelectField label="Tipo" value={type} options={TYPES} onChange={setType} />
      <TextField label="Título" value={title} onChangeText={setTitle} placeholder={type === 'Sugestão' ? 'Ex.: Filtro por músculo no histórico' : 'Ex.: O timer não toca o som'} maxLength={100} />
      <TextField label="Mensagem" value={message} onChangeText={setMessage} placeholder="Conte com detalhes o que aconteceu ou qual é a sua ideia" multiline maxLength={2000} />

      <View className="gap-1.5">
        <Text variant="label" tone="muted">Print (opcional)</Text>
        {imageUri ? (
          <View className="self-start">
            <Image source={{ uri: imageUri }} style={{ width: 120, height: 160, borderRadius: 16 }} contentFit="cover" />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remover print"
              onPress={() => setImageUri(null)}
              className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-foreground items-center justify-center"
            >
              <X size={14} color={colors.background} />
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={attach} className="h-24 rounded-2xl border border-dashed border-border items-center justify-center gap-1.5 active:bg-surface-2">
            <ImagePlus size={22} color={colors.muted} />
            <Text tone="muted" className="text-sm">Anexar imagem da galeria</Text>
          </Pressable>
        )}
      </View>

      <Button label="Enviar relato" size="lg" loading={sending} onPress={submit} />
    </ScreenScroll>
  )
}
