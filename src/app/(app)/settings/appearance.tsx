import { router } from 'expo-router'
import { Check, Crown, Monitor, Moon, Sun } from 'lucide-react-native'
import { Pressable, View } from 'react-native'
import { Card } from '@/components/ui/card'
import { SegmentedControl } from '@/components/ui/misc'
import { ScreenScroll, SectionTitle } from '@/components/ui/screen'
import { Text } from '@/components/ui/text'
import { trackDarkModeToggled } from '@/lib/analytics'
import { haptics } from '@/lib/haptics'
import { useCurrentUser } from '@/providers/session-provider'
import { useAppTheme, type ThemeMode } from '@/providers/theme-provider'
import { PRIMARY_COLORS, useThemeColors } from '@/theme/colors'

export default function AppearanceScreen() {
  const profile = useCurrentUser()
  const colors = useThemeColors()
  const { themeMode, setThemeMode, primaryColor, setPrimaryColor } = useAppTheme()
  const isPremium = !!profile.isPremium

  return (
    <ScreenScroll contentClassName="pt-2 gap-6">
      <View className="gap-2">
        <SectionTitle title="Tema" />
        <SegmentedControl<ThemeMode>
          value={themeMode}
          onChange={mode => {
            setThemeMode(mode)
            trackDarkModeToggled(mode === 'dark')
          }}
          options={[
            { value: 'light', label: 'Claro', icon: Sun },
            { value: 'dark', label: 'Escuro', icon: Moon },
            { value: 'system', label: 'Sistema', icon: Monitor },
          ]}
        />
        <Text variant="caption" tone="subtle" className="px-1">“Sistema” acompanha o modo escuro do Android.</Text>
      </View>

      <View className="gap-2">
        <SectionTitle title="Cor principal" action={!isPremium ? <Crown size={14} color={colors.premium} /> : undefined} />
        <Card className="p-4 gap-4">
          <View className="flex-row flex-wrap gap-3 justify-between">
            {PRIMARY_COLORS.map(color => {
              const selected = color.hex.toLowerCase() === primaryColor.toLowerCase()
              const locked = !isPremium && color !== PRIMARY_COLORS[0]
              return (
                <Pressable
                  key={color.hex}
                  accessibilityRole="radio"
                  accessibilityLabel={`${color.name}${locked ? ', exclusivo Premium' : ''}`}
                  accessibilityState={{ checked: selected }}
                  onPress={() => {
                    if (locked) {
                      router.push('/premium')
                      return
                    }
                    haptics.selection()
                    setPrimaryColor(color.hex)
                  }}
                  className="items-center gap-1.5"
                >
                  <View
                    style={{ backgroundColor: color.hex, opacity: locked ? 0.35 : 1 }}
                    className="w-11 h-11 rounded-full items-center justify-center"
                  >
                    {selected && <Check size={20} color="#ffffff" strokeWidth={3} />}
                  </View>
                  <Text variant="caption" tone={selected ? 'default' : 'muted'}>{color.name}</Text>
                </Pressable>
              )
            })}
          </View>
          {!isPremium && (
            <Pressable onPress={() => router.push('/premium')}>
              <Text className="text-sm text-center">
                <Text className="text-sm font-semibold text-premium">Premium</Text>
                <Text tone="muted" className="text-sm"> libera todas as cores</Text>
              </Text>
            </Pressable>
          )}
        </Card>
      </View>
    </ScreenScroll>
  )
}
