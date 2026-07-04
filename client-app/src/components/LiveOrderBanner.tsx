import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated'
import { spacing, cut, fonts } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { useActiveOrder, STATUS_COPY } from '../context/ActiveOrderContext'
import { statusIndex } from '@spotly/shared'
import { RootStackParamList } from '../navigation'
import Tappable from './Tappable'
import AppText from './AppText'

type Nav = NativeStackNavigationProp<RootStackParamList>

// Uber-style "live activity" — a persistent card surfacing the in-progress
// order on Home, so the customer can resume tracking from anywhere.
export default function LiveOrderBanner() {
  const { colors } = useTheme()
  const nav = useNavigation<Nav>()
  const { activeOrder } = useActiveOrder()

  // Pulsing dot to signal "live".
  const pulse = useSharedValue(0)
  useEffect(() => {
    pulse.value = withRepeat(withSequence(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      withTiming(0, { duration: 900, easing: Easing.inOut(Easing.quad) }),
    ), -1, false)
  }, [])
  const dotStyle = useAnimatedStyle(() => ({ opacity: 0.4 + pulse.value * 0.6, transform: [{ scale: 0.85 + pulse.value * 0.4 }] }))

  if (!activeOrder) return null

  const copy = STATUS_COPY[activeOrder.status]
  const total = statusIndex('delivered')
  const progress = Math.min(1, statusIndex(activeOrder.status) / total)
  const delivered = activeOrder.status === 'delivered'

  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={{ paddingHorizontal: spacing.md, marginTop: spacing.md }}>
      <Tappable
        onPress={() => nav.navigate('OrderTracking', { orderNumber: activeOrder.ref, total: activeOrder.total, items: activeOrder.items })}
        style={[styles.card, { backgroundColor: colors.primary }]}
      >
        <View style={styles.slash} />
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Ionicons name={copy.icon as any} size={20} color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.topline}>
              {!delivered && <Animated.View style={[styles.liveDot, dotStyle]} />}
              <AppText variant="label" style={styles.liveLabel}>
                {delivered ? 'Delivered' : 'Live order'} · {activeOrder.ref}
              </AppText>
            </View>
            <AppText variant="bodyBold" style={styles.title} numberOfLines={1}>{copy.label}</AppText>
            <AppText variant="caption" style={styles.sub} numberOfLines={1}>
              {activeOrder.driverName ? `${activeOrder.driverName} · ${copy.sub}` : copy.sub}
            </AppText>
          </View>
          <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.85)" />
        </View>

        {/* progress bar */}
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${Math.max(6, progress * 100)}%` }]} />
        </View>
      </Tappable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: { ...cut.card, padding: 14, overflow: 'hidden' },
  slash: { position: 'absolute', top: -30, right: -20, width: 100, height: 100, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '20deg' }] },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topline: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#fff' },
  liveLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 9.5 },
  title: { color: '#fff', marginTop: 2 },
  sub: { color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  track: { height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', marginTop: 12, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3, backgroundColor: '#fff' },
})
