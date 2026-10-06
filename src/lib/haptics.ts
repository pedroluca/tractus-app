import * as Haptics from 'expo-haptics'

// Falhas de haptics nunca devem quebrar o fluxo (ex.: aparelho sem motor de vibração)
const safe = (fn: () => Promise<void>) => () => {
  fn().catch(() => {})
}

export const haptics = {
  selection: safe(() => Haptics.selectionAsync()),
  light: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  medium: safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  success: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  warning: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
  error: safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)),
}
