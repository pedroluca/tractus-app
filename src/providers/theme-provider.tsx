import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider, type Theme } from 'expo-router'
import { createContext, use, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Uniwind, useUniwind } from 'uniwind'
import { updateUserFields } from '@/data/profile'
import { kv, storageKeys } from '@/lib/storage'
import { DEFAULT_PRIMARY, PRIMARY_COLORS, useThemeColors } from '@/theme/colors'
import { useSession } from './session-provider'

export type ThemeMode = 'light' | 'dark' | 'system'

type ThemeContextValue = {
  themeMode: ThemeMode
  isDark: boolean
  primaryColor: string
  setThemeMode: (mode: ThemeMode) => void
  setPrimaryColor: (hex: string) => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const resolvePrimary = (hex: string | undefined) =>
  PRIMARY_COLORS.find(color => color.hex.toLowerCase() === hex?.toLowerCase()) ?? DEFAULT_PRIMARY

function applyPrimary(hex: string) {
  const entry = resolvePrimary(hex)
  for (const theme of ['light', 'dark'] as const) {
    Uniwind.updateCSSVariables(theme, {
      '--color-primary': entry.hex,
      '--color-primary-strong': entry.strong,
    })
  }
}

const isThemeMode = (value: unknown): value is ThemeMode => value === 'light' || value === 'dark' || value === 'system'

// Aplica o que estava salvo no aparelho antes do primeiro render, para não piscar o tema errado
const storedMode = kv.getString(storageKeys.themeMode)
const initialMode: ThemeMode = isThemeMode(storedMode) ? storedMode : 'system'
const initialPrimary = resolvePrimary(kv.getString(storageKeys.primaryColor)).hex
Uniwind.setTheme(initialMode)
applyPrimary(initialPrimary)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { profile } = useSession()
  // Escolha feita neste aparelho durante a sessão; tem prioridade sobre o que veio do Firestore
  const [modeOverride, setModeOverride] = useState<ThemeMode | null>(null)
  const [colorOverride, setColorOverride] = useState<string | null>(null)
  const { theme } = useUniwind()
  const colors = useThemeColors()

  // O Firestore é a fonte da verdade entre aparelhos (o web salva os mesmos campos)
  const remoteMode = isThemeMode(profile?.themeMode) ? profile.themeMode : null
  const themeMode = modeOverride ?? remoteMode ?? initialMode
  const primaryColor = colorOverride ?? (profile?.primaryColor ? resolvePrimary(profile.primaryColor).hex : initialPrimary)

  // Sincroniza os sistemas externos (Uniwind e armazenamento local) com o estado
  useEffect(() => {
    Uniwind.setTheme(themeMode)
    kv.set(storageKeys.themeMode, themeMode)
  }, [themeMode])

  useEffect(() => {
    applyPrimary(primaryColor)
    kv.set(storageKeys.primaryColor, primaryColor)
  }, [primaryColor])

  const isDark = theme === 'dark'
  const profileId = profile?.id

  const value = useMemo<ThemeContextValue>(() => ({
    themeMode,
    isDark,
    primaryColor,
    setThemeMode: mode => {
      setModeOverride(mode)
      if (profileId) {
        const resolved = mode === 'system' ? (isDark ? 'dark' : 'light') : mode
        updateUserFields(profileId, { themeMode: mode, theme: resolved }).catch(() => {})
      }
    },
    setPrimaryColor: hex => {
      const applied = resolvePrimary(hex).hex
      setColorOverride(applied)
      if (profileId) updateUserFields(profileId, { primaryColor: applied }).catch(() => {})
    },
  }), [themeMode, isDark, primaryColor, profileId])

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme
    return {
      ...base,
      colors: {
        ...base.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.foreground,
        border: colors.border,
        notification: colors.danger,
      },
    }
  }, [isDark, colors.primary, colors.background, colors.surface, colors.foreground, colors.border, colors.danger])

  return (
    <ThemeContext value={value}>
      <NavigationThemeProvider value={navigationTheme}>{children}</NavigationThemeProvider>
    </ThemeContext>
  )
}

export function useAppTheme() {
  const context = use(ThemeContext)
  if (!context) throw new Error('useAppTheme precisa estar dentro de ThemeProvider')
  return context
}
