import React, { useEffect, useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useJobs } from '../context/JobsContext'
import { useDriver } from '../context/DriverContext'
import { useAuth } from '../context/AuthContext'
import { weeklyEarnings, earningsSummary, earningsHistory, demandForecast, peakWindow, FareBreakdown } from '../data/mock'
import { getApiUrl } from '@spotly/shared'
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

export default function EarningsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { completedJobs } = useJobs()
  const { pendingPayout, cashOutsToday, cashOut } = useDriver()
  const { user, accessToken } = useAuth()
  const maxAmount = Math.max(...weeklyEarnings.map(d => d.amount))
  const pending = useCountUp(pendingPayout, 700)
  const canCashOut = pendingPayout > 0 && cashOutsToday < earningsSummary.maxCashOutsPerDay

  const [liveWeekAmount, setLiveWeekAmount] = useState(0)
  const [liveTrips, setLiveTrips] = useState(0)
  const [apiHistory, setApiHistory] = useState<FareBreakdown[]>([])

  useEffect(() => {
    if (!user?.id || !accessToken) return
    fetch(`${getApiUrl()}/api/drivers/${user.id}/earnings`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        if (data.grossEarnings > 0) setLiveWeekAmount(data.grossEarnings)
        if (data.deliveries > 0)    setLiveTrips(data.deliveries)
        const fares: FareBreakdown[] = (data.recentDeliveries ?? []).map((o: any) => ({
          id:          `api-${o.ref}`,
          vendorName:  o.merchantName || 'Delivery',
          route:       `Pickup → ${(o.address || '').split(',')[0] || 'Dropoff'}`,
          completedAt: o.placedAt ? new Date(o.placedAt).toLocaleDateString() : 'Completed',
          base:        Number((3.5 + (o.deliveryFee || 0)).toFixed(2)),
          surgeAmt:    0,
          boost:       0,
          tip:         0,
        }))
        if (fares.length) setApiHistory(fares)
      })
      .catch(() => {/* fallback to mock */})
  }, [user?.id, accessToken])

  const weekAmount = liveWeekAmount || earningsSummary.week.amount
  const weekTrips  = liveTrips      || earningsSummary.week.trips

  const sessionFares: FareBreakdown[] = completedJobs.map(j => ({
    id: j.id,
    vendorName: j.vendorName,
    route: `${j.pickup.split(',')[0]} → ${j.dropoff.split(',')[0]}`,
    completedAt: 'Just now',
    base: j.payout - (j.boost ?? 0),
    surgeAmt: 0,
    boost: j.boost ?? 0,
    tip: j.tip,
  }))
  const historyFares = apiHistory.length ? apiHistory : earningsHistory
  const historyRefs = new Set(apiHistory.map(f => f.id))
  const sessionFaresFiltered = sessionFares.filter(f => !historyRefs.has(`api-${f.id}`))
  const allFares = [...sessionFaresFiltered, ...historyFares]

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AppText variant="h1" style={{ color: colors.textPrimary }}>Earnings</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Balance + instant cash out */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.summaryCard}>
          <View style={styles.summarySlash} />
          <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>Pending payout</AppText>
          <AppText variant="display" style={{ color: colors.white, fontSize: 40, marginVertical: 4 }}>${pending.toFixed(2)}</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
            {pendingPayout > 0 ? `Auto-payout ${earningsSummary.nextPayoutDate}` : 'Cashed out — new earnings land here'}
          </AppText>

          <Tappable onPress={cashOut} disabled={!canCashOut} style={[styles.cashOutBtn, { backgroundColor: canCashOut ? colors.white : 'rgba(255,255,255,0.25)' }]}>
            <Ionicons name="flash" size={15} color={canCashOut ? colors.primary : 'rgba(255,255,255,0.6)'} />
            <AppText variant="bodyBold" style={{ color: canCashOut ? colors.primary : 'rgba(255,255,255,0.6)', fontSize: 14 }}>
              Cash out instantly · ${earningsSummary.cashOutFee.toFixed(2)} fee
            </AppText>
          </Tappable>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.65)', marginTop: 8, fontSize: 10.5 }}>
            {cashOutsToday} of {earningsSummary.maxCashOutsPerDay} instant cash outs used today
          </AppText>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).springify().damping(16)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>${weekAmount.toFixed(2)}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>This week</AppText>
          </View>
          <View style={styles.statCard}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>{weekTrips}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>Trips</AppText>
          </View>
        </Animated.View>

        {/* Weekly chart */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>This week</AppText>
        </View>
        <Animated.View entering={FadeInDown.delay(110).springify().damping(16)} style={styles.chartCard}>
          <View style={styles.chartRow}>
            {weeklyEarnings.map((day, i) => (
              <View key={day.label} style={styles.chartCol}>
                <GrowBar pct={day.amount / maxAmount} index={i} color={day.amount === maxAmount ? colors.primary : colors.primary + '99'} trackColor={colors.surfaceAlt} />
                <AppText variant="label" style={{ fontSize: 9.5, marginTop: 8, color: colors.textMuted }}>{day.label}</AppText>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Demand forecast */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.amber }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary, flex: 1 }}>Busiest hours today</AppText>
        </View>
        <Animated.View entering={FadeInDown.delay(150).springify().damping(16)} style={styles.chartCard}>
          <View style={[styles.chartRow, { height: 90 }]}>
            {demandForecast.map((h, i) => (
              <View key={h.hour} style={styles.chartCol}>
                <GrowBar pct={h.level} index={i} color={h.level >= 0.85 ? colors.amber : colors.amber + '66'} trackColor={colors.surfaceAlt} width={11} />
                <AppText variant="label" style={{ fontSize: 8.5, marginTop: 8, color: colors.textMuted }}>{h.hour}</AppText>
              </View>
            ))}
          </View>
          <View style={styles.peakRow}>
            <Ionicons name="flame" size={13} color={colors.amber} />
            <AppText variant="caption" style={{ color: colors.textMuted }}>Predicted peak: {peakWindow}</AppText>
          </View>
        </Animated.View>

        {/* Trip receipts */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Trip receipts ({allFares.length})</AppText>
        </View>

        {allFares.map((fare, i) => {
          const total = fare.base + fare.surgeAmt + fare.boost + fare.tip
          return (
            <Animated.View key={fare.id} entering={FadeInDown.delay(i * 60).springify().damping(16)}>
              <Pressable onPress={() => nav.navigate('FareBreakdown', { fare })} style={styles.tripRow}>
                <View style={styles.tripStub} />
                <View style={styles.tripCheck}>
                  <Ionicons name="receipt-outline" size={14} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{fare.vendorName}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{fare.route} · {fare.completedAt}</AppText>
                </View>
                <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 16 }}>${total.toFixed(2)}</AppText>
                <Ionicons name="chevron-forward" size={15} color={colors.textLight} />
              </Pressable>
            </Animated.View>
          )
        })}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.md },

  summaryCard: { backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, marginBottom: spacing.md, overflow: 'hidden' },
  summarySlash: { position: 'absolute', bottom: -40, left: -30, width: 120, height: 120, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-15deg' }] },
  cashOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 100, paddingVertical: 13, marginTop: 16 },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },
  chartCard: { backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 130 },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
  peakRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.divider, borderStyle: 'dashed' },

  tripRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' },
  tripStub: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.primary },
  tripCheck: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
})
