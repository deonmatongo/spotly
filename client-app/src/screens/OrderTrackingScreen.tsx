import React, { useCallback, useEffect, useRef, useState } from 'react'
import {
  View, Text, ScrollView, Pressable, StyleSheet, Animated, Dimensions,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import TrackingMap from '../components/TrackingMap'
import { DriverFix } from '../hooks/useDriverLocation'
import { getEtaMinutes } from '../services/eta'
import { DEST_COORD } from '../config/tracking'
import { orderBus } from '../services/orderBus'
import { statusToStage } from '@spotly/shared'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'OrderTracking'>

const STAGES = [
  { id: 0, icon: 'checkmark-circle-outline' as const, label: 'Order Confirmed', desc: 'Your order has been received', time: 'Just now' },
  { id: 1, icon: 'restaurant-outline' as const, label: 'Preparing', desc: 'The kitchen is preparing your order', time: '~5 min' },
  { id: 2, icon: 'bicycle-outline' as const, label: 'On The Way', desc: 'Your rider has picked up the order', time: '~15 min' },
  { id: 3, icon: 'home-outline' as const, label: 'Delivered', desc: 'Your order has arrived. Enjoy!', time: '' },
]

export default function OrderTrackingScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { orderNumber, total, items } = useRoute<Route>().params
  const [stage, setStage] = useState(0)
  const progressAnim = useRef(new Animated.Value(0)).current
  const pulseAnim = useRef(new Animated.Value(1)).current
  // Once the merchant/driver publish real progress, the bus drives the timeline
  // and the canned timers below stand down. If no backend is running, the timers
  // still animate a self-contained demo.
  const hasLiveRef = useRef(false)

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    ).start()
  }, [])

  const animateTo = useCallback((next: number) => {
    Animated.timing(progressAnim, {
      toValue: next / (STAGES.length - 1),
      duration: 600,
      useNativeDriver: false,
    }).start()
  }, [])

  // Live status from the order bus (merchant accepts/prepares/readies, driver
  // picks up / delivers). Any progress beyond "placed" hands the timeline over
  // to real events.
  useEffect(() => {
    const off = orderBus.trackOrder(orderNumber, evt => {
      const st = statusToStage(evt.status)
      if (st > 0) hasLiveRef.current = true
      if (!hasLiveRef.current) return
      setStage(prev => {
        if (st === prev) return prev
        animateTo(st)
        return st
      })
    })
    return off
  }, [orderNumber, animateTo])

  useEffect(() => {
    if (hasLiveRef.current) return
    if (stage >= STAGES.length - 1) return
    const t = setTimeout(() => {
      if (hasLiveRef.current) return
      setStage(s => {
        const next = s + 1
        animateTo(next)
        return next
      })
    }, stage === 0 ? 4000 : stage === 1 ? 7000 : 12000)
    return () => clearTimeout(t)
  }, [stage, animateTo])

  // Live ETA from the driver's latest fix — recomputed at most every 20s
  // (the OSRM demo server is rate-limited). Stage-based estimate is the
  // fallback until the first fix arrives.
  const [liveEta, setLiveEta] = useState<number | null>(null)
  const lastEtaAtRef = useRef(0)
  const handleFix = useCallback((fix: DriverFix) => {
    const now = Date.now()
    if (now - lastEtaAtRef.current < 20000) return
    lastEtaAtRef.current = now
    getEtaMinutes({ lat: fix.lat, lng: fix.lng }, DEST_COORD).then(mins => {
      if (mins !== null) setLiveEta(mins)
    })
  }, [])

  const stageEta = stage === 0 ? 28 : stage === 1 ? 22 : stage === 2 ? 10 : 0
  const etaMinutes = liveEta ?? stageEta
  const isDelivered = stage === STAGES.length - 1

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.popToTop()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Track Order</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* ETA Card */}
        <View style={styles.etaCard}>
          {isDelivered ? (
            <>
              <View style={styles.deliveredIcon}>
                <Ionicons name="checkmark" size={32} color={colors.white} />
              </View>
              <Text style={styles.etaTitle}>Delivered!</Text>
              <Text style={styles.etaSub}>Your order has arrived. Enjoy your meal 🎉</Text>
            </>
          ) : (
            <>
              <Animated.View style={[styles.etaPulse, { transform: [{ scale: pulseAnim }] }]}>
                <Ionicons name="bicycle-outline" size={28} color={colors.white} />
              </Animated.View>
              <Text style={styles.etaTitle}>
                {etaMinutes} min
              </Text>
              <Text style={styles.etaSub}>{STAGES[stage].desc}</Text>
            </>
          )}
          <View style={styles.orderNumRow}>
            <Text style={styles.orderNumLabel}>Order</Text>
            <Text style={styles.orderNum}>{orderNumber}</Text>
            <Text style={styles.orderTotal}> · ${total.toFixed(2)}</Text>
          </View>
        </View>

        {/* Live tracking map */}
        <View style={styles.mapWrap}>
          <TrackingMap tripRef={orderNumber} height={220} onFix={handleFix} />
        </View>

        {/* Status Timeline */}
        <Text style={styles.sectionTitle}>Order Status</Text>
        <View style={styles.timeline}>
          {STAGES.map((s, i) => {
            const done = i < stage
            const active = i === stage
            const future = i > stage
            return (
              <View key={s.id} style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                  <View style={[
                    styles.timelineDot,
                    done && styles.timelineDotDone,
                    active && styles.timelineDotActive,
                  ]}>
                    {done ? (
                      <Ionicons name="checkmark" size={14} color={colors.white} />
                    ) : (
                      <Ionicons
                        name={s.icon}
                        size={14}
                        color={active ? colors.white : colors.textLight}
                      />
                    )}
                  </View>
                  {i < STAGES.length - 1 && (
                    <View style={[styles.timelineLine, done && styles.timelineLineDone]} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineHeader}>
                    <Text style={[
                      styles.timelineLabel,
                      future && styles.timelineLabelFuture,
                      active && styles.timelineLabelActive,
                    ]}>
                      {s.label}
                    </Text>
                    {!future && (
                      <Text style={styles.timelineTime}>{done ? '✓' : s.time}</Text>
                    )}
                  </View>
                  {(done || active) && (
                    <Text style={styles.timelineDesc}>{s.desc}</Text>
                  )}
                </View>
              </View>
            )
          })}
        </View>

        {/* Rider card */}
        {!isDelivered && (
          <>
            <Text style={styles.sectionTitle}>Your Rider</Text>
            <View style={styles.riderCard}>
              <View style={styles.riderLeft}>
                <View style={styles.riderAvatar}>
                  <Text style={styles.riderInitial}>T</Text>
                </View>
                <View>
                  <Text style={styles.riderName}>Tatenda Moyo</Text>
                  <View style={styles.riderStars}>
                    {[1,2,3,4,5].map(i => (
                      <Ionicons key={i} name="star" size={11} color={colors.amber} />
                    ))}
                    <Text style={styles.riderRating}> 4.9</Text>
                  </View>
                </View>
              </View>
              <View style={styles.riderActions}>
                <Pressable style={styles.riderBtn}>
                  <Ionicons name="call-outline" size={18} color={colors.primary} />
                </Pressable>
                <Pressable style={styles.riderBtn}>
                  <Ionicons name="chatbubble-outline" size={18} color={colors.primary} />
                </Pressable>
              </View>
            </View>
          </>
        )}

        {/* Items summary */}
        <Text style={styles.sectionTitle}>Items ({items})</Text>
        <View style={styles.itemsSummaryCard}>
          <View style={styles.itemsSummaryRow}>
            <Ionicons name="bag-outline" size={16} color={colors.textMuted} />
            <Text style={styles.itemsSummaryText}>{items} item{items !== 1 ? 's' : ''} from your order</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="help-circle-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionBtnText}>Help</Text>
          </Pressable>
          {!isDelivered && stage < 2 && (
            <Pressable style={[styles.actionBtn, styles.actionBtnRed]}>
              <Ionicons name="close-circle-outline" size={18} color={colors.red} />
              <Text style={[styles.actionBtnText, { color: colors.red }]}>Cancel Order</Text>
            </Pressable>
          )}
          {isDelivered && (
            <Pressable style={[styles.actionBtn, styles.actionBtnGreen]}>
              <Ionicons name="star-outline" size={18} color={colors.primary} />
              <Text style={[styles.actionBtnText, { color: colors.primary }]}>Leave a Review</Text>
            </Pressable>
          )}
        </View>

        {isDelivered && (
          <Pressable style={styles.homeBtn} onPress={() => nav.popToTop()}>
            <Text style={styles.homeBtnText}>Back to Home</Text>
          </Pressable>
        )}

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const { width: W } = Dimensions.get('window')

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: 32 },

  etaCard: {
    alignItems: 'center', backgroundColor: colors.primary,
    borderRadius: radius.xl, padding: spacing.lg, marginTop: spacing.md, marginBottom: spacing.md,
    ...shadow.md,
  },
  etaPulse: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  deliveredIcon: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.25)', alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  etaTitle: { fontSize: 36, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  etaSub: { fontSize: 14, color: 'rgba(255,255,255,0.8)', textAlign: 'center', marginTop: 6, marginBottom: 16 },
  orderNumRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: radius.md, paddingHorizontal: 14, paddingVertical: 8 },
  orderNumLabel: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginRight: 4 },
  orderNum: { fontSize: 13, fontWeight: '700', color: colors.white },
  orderTotal: { fontSize: 13, color: 'rgba(255,255,255,0.7)' },

  mapWrap: { marginBottom: spacing.md },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12, marginTop: 4 },

  timeline: { marginBottom: spacing.md },
  timelineRow: { flexDirection: 'row', gap: 14, marginBottom: 0 },
  timelineLeft: { alignItems: 'center', width: 32 },
  timelineDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surfaceAlt, borderWidth: 2, borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  timelineDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineDotActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  timelineLine: { flex: 1, width: 2, backgroundColor: colors.border, minHeight: 36, marginVertical: 2 },
  timelineLineDone: { backgroundColor: colors.primary },
  timelineContent: { flex: 1, paddingBottom: 20 },
  timelineHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineLabel: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  timelineLabelFuture: { color: colors.textLight },
  timelineLabelActive: { color: colors.primary },
  timelineTime: { fontSize: 12, color: colors.textMuted, fontWeight: '500' },
  timelineDesc: { fontSize: 13, color: colors.textMuted, marginTop: 3, lineHeight: 18 },

  riderCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  riderLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  riderAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  riderInitial: { fontSize: 18, fontWeight: '700', color: colors.white },
  riderName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  riderStars: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  riderRating: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  riderActions: { flexDirection: 'row', gap: 8 },
  riderBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center',
  },

  itemsSummaryCard: {
    backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14,
    marginBottom: spacing.md, borderWidth: 1, borderColor: colors.border,
  },
  itemsSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemsSummaryText: { fontSize: 14, color: colors.textMuted },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg,
    paddingVertical: 14, borderWidth: 1, borderColor: colors.border,
  },
  actionBtnRed: { borderColor: colors.redLight, backgroundColor: colors.redLight },
  actionBtnGreen: { borderColor: colors.primaryPale, backgroundColor: colors.primaryPale },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  homeBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 16, alignItems: 'center',
  },
  homeBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
})
