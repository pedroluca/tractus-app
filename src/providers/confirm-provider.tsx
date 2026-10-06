import { CircleAlert, type LucideIcon } from 'lucide-react-native'
import { createContext, use, useCallback, useState, type ReactNode } from 'react'
import { View } from 'react-native'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Text } from '@/components/ui/text'
import { haptics } from '@/lib/haptics'
import { useThemeColors } from '@/theme/colors'

type ConfirmTone = 'danger' | 'warning'

type ConfirmOptions = {
  title: string
  message: string
  confirmLabel: string
  icon?: LucideIcon
  tone?: ConfirmTone
  /** Se devolver uma Promise, o diálogo fica aberto com loading até ela terminar */
  onConfirm: () => void | Promise<unknown>
}

type ConfirmFn = (options: ConfirmOptions) => void

const ConfirmContext = createContext<ConfirmFn | null>(null)

/** Substitui o Alert nativo nas confirmações, com o visual dos diálogos do app */
export function ConfirmProvider({ children }: { children: ReactNode }) {
  const colors = useThemeColors()
  const [request, setRequest] = useState<ConfirmOptions | null>(null)
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  const confirm = useCallback<ConfirmFn>(options => {
    haptics.warning()
    setLoading(false)
    setRequest(options)
    setVisible(true)
  }, [])

  const close = () => {
    if (!loading) setVisible(false)
  }

  const handleConfirm = async () => {
    if (!request) return
    const result = request.onConfirm()
    if (result instanceof Promise) {
      setLoading(true)
      await result.catch(() => {})
      setLoading(false)
    }
    setVisible(false)
  }

  const tone = request?.tone ?? 'danger'
  const toneColor = tone === 'danger' ? colors.danger : colors.warning
  const Icon = request?.icon ?? CircleAlert

  return (
    <ConfirmContext value={confirm}>
      {children}
      <Dialog visible={visible} onClose={close}>
        {request && (
          <View className="items-center gap-4">
            <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: `${toneColor}1F` }}>
              <Icon size={28} color={toneColor} strokeWidth={2.2} />
            </View>

            <View className="items-center gap-1.5">
              <Text variant="heading" className="text-center text-xl">{request.title}</Text>
              <Text tone="muted" className="text-center text-[15px] leading-[22px]">{request.message}</Text>
            </View>

            <View className="flex-row gap-3 self-stretch mt-1">
              <Button label="Cancelar" variant="secondary" onPress={close} disabled={loading} className="flex-1" />
              <Button
                label={request.confirmLabel}
                variant={tone === 'danger' ? 'danger' : 'primary'}
                onPress={handleConfirm}
                loading={loading}
                className="flex-1"
              />
            </View>
          </View>
        )}
      </Dialog>
    </ConfirmContext>
  )
}

export function useConfirm() {
  const context = use(ConfirmContext)
  if (!context) throw new Error('useConfirm precisa estar dentro de ConfirmProvider')
  return context
}
