import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolation, FadeInDown,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import { Palette, useTheme } from '../context/ThemeContext'
import { cut, spacing } from '../theme'
import { DeliveryJob } from '../data/mock'
import AppText from './AppText'
import Tappable from './Tappable'

const TYPE_LABEL: Record<DeliveryJob['type'], string> = {
  courier: 'Courier',
  food: 'Food',
  groceries: 'Groceries',
}

const TYPE_ICON: Record<DeliveryJob['type'], keyof typeof Ionicons.glyphMap> = {
  courier: 'cube-outline',
  food: 'restaurant-outline',
  groceries: 'bag-handle-outline',
}

const REVEAL = 84

export default function JobCard({ job, index = 0, onPress, onDecline }: { job: DeliveryJob; index?: number; onPress: () => void; onDecline: () => void }) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const total = job.payout + job.tip
  const x = useSharedValue(0)

  const fireDecline = () => onDecline()

  const gesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onChange(e => {
      x.value = Math.min(0, Math.max(-REVEAL - 24, x.value + e.changeX))
    })
    .onEnd(() => {
      if (x.value < -REVEAL * 0.85) {
        x.value = withTiming(-400, { duration: 220 }, finished => {
          if (finished) runOnJS(fireDecline)()
        })
      } else {
        x.value = withSpring(0, { damping: 18, stiffness: 220 })
      }
    })

  const cardStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const declineOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-REVEAL, -20], [1, 0], Extrapolation.CLAMP),
  }))

  return (
    <Animated.View entering={FadeInDown.delay(index * 90).springify().damping(16)} style={styles.wrap}>
      <Animated.View style={[styles.backdrop, declineOpacity]}>
        <Ionicons name="close-circle" size={22} color={colors.white} />
        <AppText variant="bodyBold" style={{ color: colors.white, marginLeft: 6 }}>Decline</AppText>
      </Animated.View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={cardStyle}>
          <Tappable onPress={onPress} style={styles.card} scaleTo={0.985}>
            <View style={styles.topRow}>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <View style={[styles.tag, { borderColor: colors.primary }]}>
                  <Ionicons name={TYPE_ICON[job.type]} size={12} color={colors.primary} />
                  <AppText variant="label" style={{ color: colors.primary, marginLeft: 4, fontSize: 10 }}>{TYPE_LABEL[job.type]}</AppText>
                </View>
                {!!job.extraStops?.length && (
                  <View style={[styles.tag, { borderColor: colors.amber }]}>
                    <Ionicons name="layers-outline" size={11} color={colors.amber} />
                    <AppText variant="label" style={{ color: colors.amber, marginLeft: 4, fontSize: 10 }}>{job.extraStops.length + 1} drops</AppText>
                  </View>
                )}
                {!!job.surge && job.surge > 1 && (
                  <View style={[styles.tag, { borderColor: colors.amber }]}>
                    <Ionicons name="flash" size={11} color={colors.amber} />
                    <AppText variant="label" style={{ color: colors.amber, marginLeft: 3, fontSize: 10 }}>{job.surge}×</AppText>
                  </View>
                )}
              </View>
              <AppText variant="caption" style={{ color: colors.textLight }}>{job.requestedAt}</AppText>
            </View>

            <AppText variant="h3" style={{ color: colors.textPrimary, marginTop: 10 }} numberOfLines={1}>{job.vendorName}</AppText>

            <View style={styles.addrRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <AppText variant="caption" style={{ color: colors.textMuted, flex: 1 }} numberOfLines={1}>{job.pickup}</AppText>
            </View>
            <View style={styles.addrRow}>
              <View style={[styles.dot, { backgroundColor: colors.red }]} />
              <AppText variant="caption" style={{ color: colors.textMuted, flex: 1 }} numberOfLines={1}>{job.dropoff}</AppText>
            </View>

            <View style={styles.footerRow}>
              <AppText variant="caption" style={{ color: colors.textMuted }}>{job.distance} · {job.estMinutes} min away</AppText>
              <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 21 }}>${total.toFixed(2)}</AppText>
            </View>
          </Tappable>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  wrap: { marginBottom: 14, position: 'relative' },
  backdrop: {
    position: 'absolute', right: 0, top: 0, bottom: 0, width: REVEAL + 24,
    backgroundColor: colors.red, alignItems: 'center', justifyContent: 'center', flexDirection: 'row',
    borderRadius: 8,
  },
  card: {
    backgroundColor: colors.surface,
    ...cut.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  tag: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.3, borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  footerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, borderStyle: 'dashed' },
})
