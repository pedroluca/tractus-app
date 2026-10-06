import { LinearGradient } from 'expo-linear-gradient'
import type { BottomTabBarProps } from 'expo-router/tabs'
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller'
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { haptics } from '@/lib/haptics'
import { useAppTheme } from '@/providers/theme-provider'
import { useThemeColors, withAlpha } from '@/theme/colors'
import { Text } from './ui/text'

export const TAB_BAR_HEIGHT = 64
// Distância entre a cápsula e a barra de navegação do sistema
const BAR_SPACING = 8
// Faixa acima da cápsula em que o conteúdo vai sumindo (sem blur nativo, isso evita texto "vazando" pelo vidro)
const FADE_HEIGHT = 28
const PADDING = 6
const RADIUS = TAB_BAR_HEIGHT / 2
const SPRING = { damping: 20, stiffness: 220, mass: 0.9 }

const TabBarInsetContext = createContext(0)

/** Espaço que o conteúdo das abas reserva no fim para não ficar atrás da cápsula (0 fora das abas) */
export function useTabBarInset() {
  return useContext(TabBarInsetContext)
}

export function TabBarInsetProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets()
  return <TabBarInsetContext.Provider value={insets.bottom + BAR_SPACING + TAB_BAR_HEIGHT}>{children}</TabBarInsetContext.Provider>
}

/**
 * Tab bar flutuante em forma de cápsula, com acabamento de vidro: preenchimento translúcido,
 * brilho no topo, borda clara e um indicador que desliza até a aba ativa.
 * Some quando o teclado abre.
 */
export function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useThemeColors()
  const { isDark } = useAppTheme()
  const insets = useSafeAreaInsets()

  const [rowWidth, setRowWidth] = useState(0)
  const itemWidth = rowWidth ? (rowWidth - PADDING * 2) / state.routes.length : 0

  // Na primeira medição o indicador já nasce no lugar; depois desliza com mola
  const indicatorX = useSharedValue(0)
  const placed = useRef(false)
  useEffect(() => {
    if (!itemWidth) return
    const target = state.index * itemWidth
    indicatorX.value = placed.current ? withSpring(target, SPRING) : target
    placed.current = true
  }, [state.index, itemWidth, indicatorX])

  const { progress: keyboard } = useReanimatedKeyboardAnimation()
  const hiddenOffset = insets.bottom + BAR_SPACING + TAB_BAR_HEIGHT + FADE_HEIGHT

  const containerStyle = useAnimatedStyle(() => ({
    opacity: 1 - keyboard.value,
    transform: [{ translateY: keyboard.value * hiddenOffset }],
  }))
  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }))

  const highlight = isDark ? 0.1 : 0.75

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.container, { paddingBottom: insets.bottom + BAR_SPACING, paddingTop: FADE_HEIGHT }, containerStyle]}
    >
      <LinearGradient
        pointerEvents="none"
        colors={[withAlpha(colors.background, 0), withAlpha(colors.background, 0.92)]}
        locations={[0, 0.55]}
        style={StyleSheet.absoluteFill}
      />

      <View
        accessibilityRole="tablist"
        style={[
          styles.capsule,
          {
            backgroundColor: withAlpha(colors.surface, isDark ? 0.74 : 0.8),
            borderColor: isDark ? 'rgba(255,255,255,0.10)' : withAlpha(colors.foreground, 0.07),
            boxShadow: isDark
              ? '0 12px 32px rgba(0,0,0,0.55), 0 2px 6px rgba(0,0,0,0.35)'
              : '0 12px 32px rgba(16,18,20,0.14), 0 2px 6px rgba(16,18,20,0.06)',
          },
        ]}
      >
        {/* Reflexo do vidro: mais claro em cima, sumindo até o meio */}
        <View pointerEvents="none" style={styles.sheen}>
          <LinearGradient
            colors={[`rgba(255,255,255,${highlight})`, 'rgba(255,255,255,0)']}
            locations={[0, 0.6]}
            style={StyleSheet.absoluteFill}
          />
        </View>
        {/* Fio de luz na borda de cima */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0)', `rgba(255,255,255,${isDark ? 0.35 : 1})`, 'rgba(255,255,255,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.rim}
        />

        <View style={styles.row} onLayout={event => setRowWidth(event.nativeEvent.layout.width)}>
          {itemWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.indicator,
                {
                  width: itemWidth,
                  backgroundColor: withAlpha(colors.primary, isDark ? 0.2 : 0.13),
                  borderColor: withAlpha(colors.primary, isDark ? 0.3 : 0.2),
                },
                indicatorStyle,
              ]}
            />
          )}

          {state.routes.map((route, index) => {
            const { options } = descriptors[route.key]
            const focused = state.index === index
            const label = options.title ?? route.name
            const color = focused ? colors.primary : colors.muted
            const badge = options.tabBarBadge

            const onPress = () => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true })
              if (!focused && !event.defaultPrevented) {
                haptics.selection()
                navigation.navigate(route.name, route.params)
              }
            }

            return (
              <Pressable
                key={route.key}
                accessibilityRole="tab"
                accessibilityState={{ selected: focused }}
                accessibilityLabel={options.tabBarAccessibilityLabel ?? label}
                onPress={onPress}
                onLongPress={() => navigation.emit({ type: 'tabLongPress', target: route.key })}
                style={styles.item}
              >
                <View>
                  {options.tabBarIcon?.({ focused, color, size: 22 })}
                  {badge != null && (
                    <View style={[styles.badge, { backgroundColor: colors.danger, borderColor: colors.surface }]}>
                      <Text className="text-[10px] leading-3 font-bold text-white">{badge}</Text>
                    </View>
                  )}
                </View>
                <Text numberOfLines={1} className={focused ? 'text-[11px] font-semibold' : 'text-[11px] font-medium'} style={{ color }}>
                  {label}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  capsule: {
    width: '100%',
    maxWidth: 440,
    height: TAB_BAR_HEIGHT,
    borderRadius: RADIUS,
    borderWidth: 1,
  },
  sheen: {
    ...StyleSheet.absoluteFill,
    borderRadius: RADIUS - 1,
    overflow: 'hidden',
  },
  rim: {
    position: 'absolute',
    top: 0,
    left: RADIUS,
    right: RADIUS,
    height: 1,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    padding: PADDING,
  },
  indicator: {
    position: 'absolute',
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    borderRadius: RADIUS - PADDING,
    borderWidth: 1,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -11,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
})
