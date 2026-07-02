import React, { useEffect } from 'react'
import { View, Modal, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS,
} from 'react-native-reanimated'
import { Palette, useTheme } from '../context/ThemeContext'
import { spacing, cut } from '../theme'
import { DeliveryJob } from '../data/mock'
import AppText from './AppText'
import Tappable from './Tappable'

const OFFER_SECONDS = 15

interface Props {
  offer: DeliveryJob
  onAccept: () => void
  onDecline: () => void
}

// Full-screen offer ping: payout up-front, route preview, and a draining
// timer bar — untouched offers auto-decline like the real thing.
export default function OfferModal({ offer, onAccept, onDecline }: Props) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const drain = useSharedValue(1)
  const total = offer.payout + offer.tip

  useEffect(() => {
    drain.value = withTiming(0, { duration: OFFER_SECONDS * 1000, easing: Easing.linear }, finished => {
      if (finished) runOnJS(onDecline)()
    })
  }, [])

  const drainStyle = useAnimatedStyle(() => ({
    width: `${drain.value * 100}%`,
    backgroundColor: drain.value > 0.35 ? colors.primary : colors.amber,
  }))

  return (
    <Modal transparent animationType="fade" onRequestClose={onDecline}>
      <View style={styles.backdrop}>
        <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.card}>
          <View style={styles.timerTrack}>
            <Animated.View style={[styles.timerFill, drainStyle]} />
          </View>

          <View style={styles.headerRow}>
            <AppText variant="label" style={{ color: colors.primary }}>New delivery request</AppText>
            {!!offer.surge && offer.surge > 1 && (
              <View style={[styles.surgeChip, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name="flash" size={11} color={colors.primary} />
                <AppText variant="label" style={{ color: colors.primary, fontSize: 10, marginLeft: 3 }}>{offer.surge}× surge</AppText>
              </View>
            )}
          </View>

          <AppText variant="display" style={{ color: colors.textPrimary, fontSize: 42, marginTop: 6 }}>${total.toFixed(2)}</AppText>
          {offer.tip > 0 && <AppText variant="caption" style={{ color: colors.textMuted }}>Includes ${offer.tip.toFixed(2)} expected tip</AppText>}

          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="navigate-outline" size={14} color={colors.textMuted} />
              <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>{offer.distance}</AppText>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={14} color={colors.textMuted} />
              <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>~{offer.estMinutes} min</AppText>
            </View>
          </View>

          <View style={styles.routeBox}>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.primary }]} />
              <AppText variant="body" style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{offer.vendorName} · {offer.pickup}</AppText>
            </View>
            <View style={styles.routeRow}>
              <View style={[styles.dot, { backgroundColor: colors.red }]} />
              <AppText variant="body" style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{offer.dropoff}</AppText>
            </View>
          </View>

          <Tappable onPress={onAccept} style={[styles.acceptBtn, { backgroundColor: colors.primary }]}>
            <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 16 }}>Accept · ${total.toFixed(2)}</AppText>
          </Tappable>
          <Pressable onPress={onDecline} style={styles.declineBtn}>
            <AppText variant="bodySemi" style={{ color: colors.textMuted }}>Decline</AppText>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,10,18,0.82)', justifyContent: 'flex-end', padding: spacing.md, paddingBottom: 40 },
  card: { backgroundColor: colors.surface, ...cut.sheet, padding: spacing.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  timerTrack: { position: 'absolute', top: 0, left: 0, right: 0, height: 4, backgroundColor: colors.surfaceAlt },
  timerFill: { height: 4 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 },
  surgeChip: { flexDirection: 'row', alignItems: 'center', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  metaRow: { flexDirection: 'row', gap: 18, marginTop: 12, marginBottom: 14 },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  routeBox: { gap: 10, borderTopWidth: 1, borderTopColor: colors.divider, borderStyle: 'dashed', paddingTop: 14, marginBottom: 18 },
  routeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
  acceptBtn: { borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
  declineBtn: { alignItems: 'center', paddingVertical: 14 },
})
