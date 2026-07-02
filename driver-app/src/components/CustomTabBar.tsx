import React, { useRef, useState } from 'react'
import { View, Pressable, StyleSheet, LayoutChangeEvent } from 'react-native'
import { BottomTabBarProps } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withDelay, withRepeat, Easing,
} from 'react-native-reanimated'
import { useTheme } from '../context/ThemeContext'
import { useJobs } from '../context/JobsContext'
import AppText from './AppText'

const ICON_MAP: Record<string, [string, string]> = {
  Jobs: ['briefcase', 'briefcase-outline'],
  Discover: ['compass', 'compass-outline'],
  Earnings: ['wallet', 'wallet-outline'],
  Profile: ['person-circle', 'person-circle-outline'],
}

const BADGE_SIZE = 44
// The indicator is absolutely positioned in the bar, so its top must equal the
// icon stack's real y-offset: bar paddingTop + tab paddingVertical.
const BAR_PAD_TOP = 10
const TAB_PAD_V = 6
// How long the badge takes to dissolve before reappearing on the new tab.
const DISSOLVE_MS = 110

// Gentle dip as the badge materializes over it, timed to the reappear delay.
function TabIcon({ name, color, focused }: { name: string; color: string; focused: boolean }) {
  const scale = useSharedValue(1)

  React.useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withTiming(0.85, { duration: DISSOLVE_MS, easing: Easing.out(Easing.quad) }),
        withSpring(1, { damping: 11, stiffness: 240 }),
      )
    }
  }, [focused])

  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <Animated.View style={style}>
      <Ionicons name={name as any} size={20} color={color} />
    </Animated.View>
  )
}

export default function CustomTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets()
  const { colors } = useTheme()
  const { activeJob } = useJobs()
  const styles = makeStyles(colors)
  const [layouts, setLayouts] = useState<{ x: number; width: number }[]>([])

  const indicatorX = useSharedValue(0)
  // 1 = fully materialized; 0 = dissolved. Drives opacity and scale together.
  const appear = useSharedValue(1)
  // Slow ambient loop — the badge looks still but its glow and size drift
  // just enough to feel alive.
  const breathe = useSharedValue(0)
  const settled = useRef(false)

  React.useEffect(() => {
    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1700, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const measure = (i: number) => (e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout
    setLayouts(prev => {
      const next = [...prev]
      next[i] = { x, width }
      return next
    })
  }

  React.useEffect(() => {
    const l = layouts[state.index]
    if (!l) return
    const center = l.x + l.width / 2 - BADGE_SIZE / 2
    if (!settled.current) {
      // Snap into place on first measurement instead of animating in from zero.
      indicatorX.value = center
      settled.current = true
    } else {
      // No visible travel: dissolve in place, jump while invisible, then
      // materialize on the new tab with a soft settle.
      indicatorX.value = withDelay(DISSOLVE_MS, withTiming(center, { duration: 0 }))
      appear.value = withSequence(
        withTiming(0, { duration: DISSOLVE_MS, easing: Easing.in(Easing.quad) }),
        withSpring(1, { damping: 13, stiffness: 210 }),
      )
    }
  }, [state.index, layouts])

  const indicatorStyle = useAnimatedStyle(() => {
    const materialize = 0.55 + appear.value * 0.45
    const ambient = 1 + breathe.value * 0.045
    return {
      opacity: appear.value,
      transform: [{ translateX: indicatorX.value }, { scale: materialize * ambient }],
      shadowOpacity: 0.3 + breathe.value * 0.3,
    }
  })

  const press = (name: string, key: string, focused: boolean) => {
    const event = navigation.emit({ type: 'tabPress', target: key, canPreventDefault: true })
    if (!focused && !event.defaultPrevented) navigation.navigate(name)
  }

  return (
    <View style={[styles.wrapper, { paddingBottom: Math.max(insets.bottom, 10) }]}>
      <View style={styles.bar}>
        <Animated.View style={[styles.indicator, indicatorStyle, { backgroundColor: colors.primary, shadowColor: colors.primary }]} />
        {state.routes.map((route, i) => {
          const focused = state.index === i
          const [activeIcon, inactiveIcon] = ICON_MAP[route.name] ?? ['ellipse', 'ellipse-outline']
          const isJobs = route.name === 'Jobs'

          return (
            <Pressable
              key={route.key}
              onLayout={measure(i)}
              onPress={() => press(route.name, route.key, focused)}
              style={styles.tab}
            >
              <View style={styles.iconStack}>
                <TabIcon
                  name={focused ? activeIcon : inactiveIcon}
                  color={focused ? colors.white : colors.textLight}
                  focused={focused}
                />
                {isJobs && !!activeJob && <View style={[styles.badge, { backgroundColor: colors.amber, borderColor: colors.surface }]} />}
              </View>
              <AppText variant="label" style={{ fontSize: 9.5, marginTop: 6, color: focused ? colors.primary : colors.textLight }}>
                {route.name}
              </AppText>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}

const makeStyles = (colors: any) => StyleSheet.create({
  wrapper: { backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: BAR_PAD_TOP,
    paddingHorizontal: 10,
  },
  indicator: {
    position: 'absolute',
    top: BAR_PAD_TOP + TAB_PAD_V,
    width: BADGE_SIZE,
    height: BADGE_SIZE,
    borderRadius: BADGE_SIZE / 2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: TAB_PAD_V },
  iconStack: { position: 'relative', width: BADGE_SIZE, height: BADGE_SIZE, alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute', top: 2, right: 10, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5,
  },
})
