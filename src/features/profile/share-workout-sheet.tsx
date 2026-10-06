import * as Clipboard from 'expo-clipboard'
import { Copy, Share2 } from 'lucide-react-native'
import { Share, View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Sheet } from '@/components/ui/sheet'
import { Text } from '@/components/ui/text'
import { buildShareCode } from '@/data/workouts'
import { trackWorkoutShared } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { useToast } from '@/providers/toast-provider'

type Props = {
  workout: { id: string; musculo: string } | null
  ownerId: string
  onClose: () => void
}

export function ShareWorkoutSheet({ workout, ownerId, onClose }: Props) {
  const toast = useToast()
  const code = workout ? buildShareCode(workout.id, ownerId) : ''

  return (
    <Sheet
      visible={!!workout}
      onClose={onClose}
      title="Compartilhar treino"
      description="Quem receber o código pode adicionar uma cópia deste treino em “Novo treino > Código de compartilhamento”."
    >
      <View className="gap-3 pb-2">
        <View className="bg-surface-2 rounded-2xl px-4 py-3.5">
          <Text variant="caption" tone="muted">{workout?.musculo}</Text>
          <Text selectable className="text-sm font-semibold mt-0.5">{code}</Text>
        </View>
        <View className="flex-row gap-2">
          <Button
            label="Copiar"
            icon={Copy}
            variant="secondary"
            className="flex-1"
            onPress={async () => {
              await Clipboard.setStringAsync(code)
              haptics.success()
              toast.success('Código copiado')
              trackWorkoutShared()
            }}
          />
          <Button
            label="Enviar"
            icon={Share2}
            className="flex-1"
            onPress={() => {
              trackWorkoutShared()
              Share.share({ message: `Treino "${workout?.musculo}" no Tractus. Use o código ao adicionar um treino: ${code}` }).catch(() => {})
            }}
          />
        </View>
      </View>
    </Sheet>
  )
}
