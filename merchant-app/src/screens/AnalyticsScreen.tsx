import React, { useEffect } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, {
  FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing,
} from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { weeklyRevenue, revenueSummary, orderDemand, peakWindow, topItems, ratingData } from '../data/mock'
import { RootStackParamList } from '../navigation'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'
import useCountUp from '../hooks/useCountUp'

type Nav = NativeStackNavigationProp<RootStackParamList>

function GrowBar({ pct, index, color, trackColor, width = 14, height = 130 }: { pct: number; index: number; color: string; trackColor: string; width?: number; height?: number }) {
  const grow = useSharedValue(0)
  useEffect(() => {
    grow.value = withDelay(index * 55, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [])
  const style = useAnimatedStyle(() => ({ height: `${grow.value * pct * 100}%` }))
  return (
    <View style={{ width, height: '86%', justifyContent: 'flex-end', borderRadius: width / 2, overflow: 'hidden', backgroundColor: trackColor }}>
      <Animated.View style={[{ width: '100%', borderRadius: width / 2, minHeight: 4, backgroundColor: color }, style]} />
    </View>
  )
}

function RatingBar({ stars, count, total, colors }: { stars: number; count: number; total: number; colors: Palette }) {
  const grow = useSharedValue(0)
  useEffect(() => {
    grow.value = withDelay((5 - stars) * 60, withTiming(1, { duration: 450, easing: Easing.out(Easing.cubic) }))
  }, [])
  const barStyle = useAnimatedStyle(() => ({ width: `${grow.value * (count / total) * 100}%` }))
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 7 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, width: 28 }}>
        <AppText variant="caption" style={{ color: colors.textMuted }}>{stars}</AppText>
        <Ionicons name="star" size={10} color={colors.amber} />
      </View>
      <View style={{ flex: 1, height: 7, backgroundColor: colors.surfaceAlt, borderRadius: 4, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', backgroundColor: colors.amber, borderRadius: 4 }, barStyle]} />
      </View>
      <AppText variant="caption" style={{ color: colors.textMuted, width: 28, textAlign: 'right' }}>{count}</AppText>
    </View>
  )
}

export default function AnalyticsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const maxAmount = Math.max(...weeklyRevenue.map(d => d.amount))
  const pending = useCountUp(revenueSummary.pendingPayout, 700)
  const weekTotal = useCountUp(revenueSummary.week.amount, 800)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AppText variant="h1" style={{ color: colors.textPrimary }}>Analytics</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Pending payout card */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.payoutCard}>
          <View style={styles.payoutSlash} />
          <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>Pending payout</AppText>
          <AppText variant="display" style={{ color: '#fff', fontSize: 40, marginVertical: 4 }}>${pending.toFixed(2)}</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Auto-payout {revenueSummary.nextPayoutDate}</AppText>
          <Tappable onPress={() => nav.navigate('Payouts')} style={styles.payoutBtn}>
            <Ionicons name="wallet-outline" size={14} color={colors.primary} />
            <AppText variant="bodyBold" style={{ color: colors.primary, fontSize: 14 }}>View payout history</AppText>
          </Tappable>
        </Animated.View>

        {/* Stats row */}
        <Animated.View entering={FadeInDown.delay(70).springify().damping(16)} style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>${weekTotal.toFixed(0)}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>This week</AppText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>{revenueSummary.week.orders}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>Orders</AppText>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>${revenueSummary.today.avgOrderValue.toFixed(2)}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>Avg order</AppText>
          </View>
        </Animated.View>

        {/* Weekly revenue chart */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Weekly revenue</AppText>
        </View>
        <Animated.View entering={FadeInDown.delay(110).springify().damping(16)} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.chartRow, { height: 130 }]}>
            {weeklyRevenue.map((day, i) => (
              <View key={day.label} style={styles.chartCol}>
                <GrowBar pct={day.amount / maxAmount} index={i} color={day.amount === maxAmount ? colors.primary : colors.primary + '99'} trackColor={colors.surfaceAlt} />
                <AppText variant="label" style={{ fontSize: 9.5, marginTop: 8, color: colors.textMuted }}>{day.label}</AppText>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Busiest hours */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.amber }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary, flex: 1 }}>Busiest hours today</AppText>
        </View>
        <Animated.View entering={FadeInDown.delay(150).springify().damping(16)} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.chartRow, { height: 90 }]}>
            {orderDemand.map((h, i) => (
              <View key={h.hour} style={styles.chartCol}>
                <GrowBar pct={h.level} index={i} color={h.level >= 0.85 ? colors.amber : colors.amber + '66'} trackColor={colors.surfaceAlt} width={11} />
                <AppText variant="label" style={{ fontSize: 8.5, marginTop: 8, color: colors.textMuted }}>{h.hour}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.peakRow}>
            <Ionicons name="flame" size={13} color={colors.amber} />
            <AppText variant="caption" style={{ color: colors.textMuted }}>Peak: {peakWindow}</AppText>
          </View>
        </Animated.View>

        {/* Top items */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Top-selling items</AppText>
        </View>
        <Animated.View entering={FadeInDown.delay(180).springify().damping(16)} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          {topItems.map((item, i) => (
            <View key={item.name} style={[styles.topItemRow, i < topItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={[styles.rankBadge, { backgroundColor: i === 0 ? colors.primaryPale : colors.surfaceAlt }]}>
                <AppText variant="label" style={{ fontSize: 9.5, color: i === 0 ? colors.primary : colors.textLight, letterSpacing: 0 }}>#{i + 1}</AppText>
              </View>
              <AppText variant="bodySemi" style={{ color: colors.textPrimary, flex: 1 }} numberOfLines={1}>{item.name}</AppText>
              <View style={{ alignItems: 'flex-end' }}>
                <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 14 }}>${item.revenue.toFixed(2)}</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted }}>{item.sold} sold</AppText>
              </View>
            </View>
          ))}
        </Animated.View>

        {/* Ratings */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.amber }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Customer ratings</AppText>
        </View>
        <Animated.View entering={FadeInDown.delay(210).springify().damping(16)} style={[styles.ratingCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.ratingLeft}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 44 }}>{ratingData.overall}</AppText>
            <View style={{ flexDirection: 'row', gap: 3, marginTop: 4 }}>
              {[1, 2, 3, 4, 5].map(s => (
                <Ionicons key={s} name="star" size={13} color={s <= Math.round(ratingData.overall) ? colors.amber : colors.border} />
              ))}
            </View>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 6 }}>{ratingData.total} reviews</AppText>
          </View>
          <View style={{ flex: 1 }}>
            {ratingData.breakdown.map(b => (
              <RatingBar key={b.stars} stars={b.stars} count={b.count} total={ratingData.total} colors={colors} />
            ))}
          </View>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.md },

  payoutCard: { backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, marginBottom: spacing.md, overflow: 'hidden' },
  payoutSlash: { position: 'absolute', bottom: -40, left: -30, width: 120, height: 120, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-15deg' }] },
  payoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 100, paddingVertical: 13, marginTop: 16 },

  statsRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  statCard: { flex: 1, ...cut.card, borderWidth: 1, padding: spacing.md, alignItems: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },
  chartCard: { borderWidth: 1, ...cut.card, padding: spacing.md, marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  peakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, borderStyle: 'dashed' },

  topItemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rankBadge: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  ratingCard: { borderWidth: 1, ...cut.card, padding: spacing.md, marginBottom: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 20 },
  ratingLeft: { alignItems: 'center', width: 90 },
})
