import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated'
import { Palette, useTheme } from '../context/ThemeContext'
import { cut } from '../theme'
import { surgeZones, hotspots } from '../data/mock'
import AppText from './AppText'

// Mock demand map: pulsing surge blobs with multipliers + merchant hotspot
// pins. Stands in for the live heatmap until a real map SDK lands.
export default function SurgeMap() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + pulse.value * 0.08 }],
    opacity: 0.75 + pulse.value * 0.25,
  }))

  return (
    <View style={styles.box}>
      <View style={styles.grid}>
        {Array.from({ length: 12 }).map((_, i) => <View key={i} style={styles.block} />)}
      </View>
      <View style={styles.road1} />
      <View style={styles.road2} />

      {surgeZones.map(z => (
        <Animated.View
          key={z.id}
          style={[
            styles.zone, pulseStyle,
            { top: z.top as any, left: z.left as any, width: z.size, height: z.size, borderRadius: z.size / 2 },
          ]}
        >
          <AppText variant="num" style={{ color: colors.white, fontSize: 15 }}>{z.label}</AppText>
        </Animated.View>
      ))}

      {hotspots.map(h => (
        <View key={h.id} style={[styles.hotspot, { top: h.top as any, left: h.left as any }]}>
          <Ionicons name="restaurant" size={11} color={colors.white} />
          <AppText variant="label" style={{ color: colors.white, fontSize: 8.5, marginLeft: 4 }}>{h.name} · {h.orders}</AppText>
        </View>
      ))}

      <View style={styles.legend}>
        <Ionicons name="flame" size={12} color={colors.amber} />
        <AppText variant="caption" style={{ color: colors.textMuted, fontSize: 10.5 }}>Surge zones pay a multiplier per order</AppText>
      </View>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  box: { height: 190, backgroundColor: '#E8F4E8', ...cut.card, overflow: 'hidden', position: 'relative' },
  grid: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, flexDirection: 'row', flexWrap: 'wrap' },
  block: { width: '25%', height: 48, borderWidth: 0.5, borderColor: 'rgba(0,0,0,0.06)' },
  road1: { position: 'absolute', top: '42%', left: 0, right: 0, height: 12, backgroundColor: '#D1FAE5', opacity: 0.8 },
  road2: { position: 'absolute', top: 0, bottom: 0, left: '48%', width: 12, backgroundColor: '#D1FAE5', opacity: 0.8 },
  zone: {
    position: 'absolute', backgroundColor: 'rgba(22,163,74,0.55)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
  },
  hotspot: {
    position: 'absolute', flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.dark, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 4,
  },
  legend: {
    position: 'absolute', bottom: 8, left: 10, flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(255,255,255,0.92)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4,
  },
})
