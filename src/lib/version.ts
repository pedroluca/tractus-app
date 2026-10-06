import * as Application from 'expo-application'
import Constants from 'expo-constants'

export const appVersion = Application.nativeApplicationVersion ?? Constants.expoConfig?.version ?? '0.0.0'

/** Compara versões semânticas: negativo se a < b, 0 se iguais, positivo se a > b */
export function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number)
  const pb = b.split('.').map(Number)
  for (let index = 0; index < Math.max(pa.length, pb.length); index++) {
    const diff = (pa[index] || 0) - (pb[index] || 0)
    if (diff !== 0) return diff
  }
  return 0
}
