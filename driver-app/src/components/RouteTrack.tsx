import React, { useEffect } from 'react'
import { View, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated'
import AppText from './AppText'
import { Palette } from '../context/ThemeContext'

interface Props {
  colors: Palette
  pickupLabel?: string
  pickupAddress: string
  pickupDetail?: string
  dropoffLabel?: string
  dropoffAddress: string
  dropoffDetail?: string
}

// Two custom pins joined by a dashed connector that draws itself in on mount —
// a stand-in for a real map without borrowing the generic "dot + solid line"
// timeline pattern.
export default function RouteTrack({ colors, pickupLabel = 'Pickup', pickupAddress, pickupDetail, dropoffLabel = 'Drop-off', dropoffAddress, dropoffDetail }: Props) {
  const grow = useSharedValue(0)

  useEffect(() => {
    grow.value = withDelay(120, withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }))
  }, [])

  const lineStyle = useAnimatedStyle(() => ({
    transform: [{ scaleY: grow.value }],
  }))

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        <View style={[styles.pinOuter, { borderColor: colors.primary }]}>
          <View style={[styles.pinInner, { backgroundColor: colors.primary }]} />
        </View>
        <View style={styles.lineTrack}>
          <Animated.View style={[styles.line, lineStyle, { backgroundColor: colors.border }]} />
        </View>
        <View style={[styles.flag, { backgroundColor: colors.red }]}>
          <View style={styles.flagNotch} />
        </View>
      </View>

      <View style={styles.copy}>
        <View style={styles.stop}>
          <AppText variant="label" style={{ color: colors.textMuted, marginBottom: 3 }}>{pickupLabel}</AppText>
          <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{pickupAddress}</AppText>
          {!!pickupDetail && <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{pickupDetail}</AppText>}
        </View>
        <View style={[styles.stop, { paddingTop: 22 }]}>
          <AppText variant="label" style={{ color: colors.textMuted, marginBottom: 3 }}>{dropoffLabel}</AppText>
          <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{dropoffAddress}</AppText>
          {!!dropoffDetail && <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{dropoffDetail}</AppText>}
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row' },
  track: { width: 22, alignItems: 'center' },
  pinOuter: { width: 16, height: 16, borderRadius: 8, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', backgroundColor: 'transparent' },
  pinInner: { width: 6, height: 6, borderRadius: 3 },
  lineTrack: { flex: 1, width: 2, marginVertical: 3, overflow: 'hidden' },
  line: { flex: 1, width: 2, borderRadius: 1 },
  flag: { width: 14, height: 18, borderTopLeftRadius: 2, borderTopRightRadius: 7, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  flagNotch: { position: 'absolute', bottom: -5, left: 5, width: 2, height: 5 },
  copy: { flex: 1, marginLeft: 14 },
  stop: {},
})
