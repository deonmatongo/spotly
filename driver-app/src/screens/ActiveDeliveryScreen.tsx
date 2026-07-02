import React, { useEffect, useRef, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming,
} from 'react-native-reanimated'
import { spacing, cut, fonts } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useJobs } from '../context/JobsContext'
import { useDriver } from '../context/DriverContext'
import { JobStatus, DropoffMode, navSteps } from '../data/mock'
import { RootStackParamList } from '../navigation'
import { locationTracker } from '../services/locationTracker'
import { MqttStatus } from '../services/mqttClient'
import RouteTrack from '../components/RouteTrack'
import DriverMap from '../components/DriverMap'
import SlideToConfirm from '../components/SlideToConfirm'
import Tappable from '../components/Tappable'
import AppText from '../components/AppText'

type Nav = NativeStackNavigationProp<RootStackParamList>

const STAGES: { id: JobStatus; label: string; action: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'accepted', label: 'Heading to pickup', action: 'Confirm pickup', icon: 'navigate-outline' },
  { id: 'picked_up', label: 'Order picked up', action: 'Start delivery', icon: 'cube-outline' },
  { id: 'en_route', label: 'On the way to customer', action: 'Slide to complete', icon: 'bicycle-outline' },
  { id: 'delivered', label: 'Delivered', action: 'Done', icon: 'checkmark-circle-outline' },
]

const VEHICLE_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  car: 'car-sport', motorcycle: 'bicycle', bicycle: 'bicycle', walking: 'walk',
}

const MODE_META: Record<DropoffMode, { icon: keyof typeof Ionicons.glyphMap; label: string; hint: string }> = {
  leave_at_door: { icon: 'camera-outline', label: 'Leave at door', hint: 'Photo proof required at drop-off' },
  meet_at_door: { icon: 'hand-left-outline', label: 'Meet at door', hint: 'Hand the order to the customer' },
  curbside: { icon: 'car-outline', label: 'Curbside', hint: 'Customer meets you at the kerb' },
}

export default function ActiveDeliveryScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { activeJob, advanceActiveJob, finishActiveJob, queuedOffer, queuedJob, spawnQueuedOffer, acceptQueuedOffer, dismissQueuedOffer } = useJobs()
  const { driver } = useDriver()
  const pulse = useSharedValue(1)
  const [navStep, setNavStep] = useState(0)
  const [completing, setCompleting] = useState(false)
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState(false)
  const [photoState, setPhotoState] = useState<'idle' | 'snapping' | 'done'>('idle')
  const [broadcastStatus, setBroadcastStatus] = useState<MqttStatus>('offline')
  const pinRef = useRef<TextInput>(null)

  useEffect(() => locationTracker.onStatus(setBroadcastStatus), [])

  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.12, { duration: 700 }), withTiming(1, { duration: 700 })), -1, false)
  }, [])

  // Cycle mock turn-by-turn instructions.
  useEffect(() => {
    const t = setInterval(() => setNavStep(s => s + 1), 5000)
    return () => clearInterval(t)
  }, [])

  // Back-to-back: near the end of the trip, ping a nearby follow-up request.
  const isFinalLeg = activeJob?.status === 'en_route'
  useEffect(() => {
    if (!isFinalLeg || queuedOffer || queuedJob) return
    const t = setTimeout(spawnQueuedOffer, 4000)
    return () => clearTimeout(t)
  }, [isFinalLeg, queuedOffer, queuedJob])

  const pulseStyle = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }] }))

  if (!activeJob) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.emptyWrap}>
          <Ionicons name="checkmark-done-circle-outline" size={44} color={colors.textLight} />
          <AppText variant="h3" style={{ color: colors.textPrimary, marginTop: 10 }}>No active delivery</AppText>
          <Tappable onPress={() => nav.navigate('MainTabs')} style={styles.homeBtn}>
            <AppText variant="bodyBold" style={{ color: colors.white }}>Back to jobs</AppText>
          </Tappable>
        </View>
      </SafeAreaView>
    )
  }

  const stageIdx = STAGES.findIndex(s => s.id === activeJob.status)
  const stage = STAGES[stageIdx]
  const mode = MODE_META[activeJob.dropoffMode]
  const steps = activeJob.status === 'accepted' ? navSteps.toPickup : navSteps.toDropoff
  const instruction = steps[navStep % steps.length]
  const isGrocery = !!activeJob.groceryItems?.length && activeJob.status === 'accepted'

  const live = broadcastStatus === 'connected'
    ? { color: colors.primary, label: 'LIVE' }
    : broadcastStatus === 'reconnecting' || broadcastStatus === 'connecting'
      ? { color: colors.amber, label: 'RECONNECTING' }
      : { color: colors.textLight, label: 'OFFLINE' }

  const finish = () => {
    setCompleting(false)
    setPinInput('')
    setPhotoState('idle')
    finishActiveJob()
    nav.navigate('MainTabs')
  }

  const submitPin = (value: string) => {
    setPinInput(value)
    setPinError(false)
    if (value.length === 4) {
      if (value === activeJob.pin) finish()
      else { setPinError(true); setPinInput('') }
    }
  }

  const takePhoto = () => {
    setPhotoState('snapping')
    setTimeout(() => setPhotoState('done'), 900)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AppText variant="h3" style={{ color: colors.textPrimary }}>Active delivery</AppText>
        <View style={[styles.refChip, { backgroundColor: colors.surfaceAlt }]}>
          <AppText variant="caption" style={{ color: colors.textMuted }}>{activeJob.ref}</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Back-to-back offer strip */}
        {queuedOffer && (
          <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.queueStrip}>
            <Ionicons name="flash" size={16} color={colors.amber} />
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 13 }}>Next job nearby · ${(queuedOffer.payout + queuedOffer.tip).toFixed(2)}</AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11 }} numberOfLines={1}>
                {queuedOffer.vendorName} · {queuedOffer.distance} away
              </AppText>
            </View>
            <Pressable onPress={acceptQueuedOffer} style={[styles.queueBtn, { backgroundColor: colors.primary }]}>
              <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 12 }}>Queue</AppText>
            </Pressable>
            <Pressable onPress={dismissQueuedOffer} hitSlop={8}>
              <Ionicons name="close" size={18} color="rgba(255,255,255,0.6)" />
            </Pressable>
          </Animated.View>
        )}
        {queuedJob && (
          <View style={styles.queuedConfirm}>
            <Ionicons name="checkmark-circle" size={15} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.textPrimary, flex: 1 }}>
              Next job queued: {queuedJob.vendorName} — starts when this one completes
            </AppText>
          </View>
        )}

        {/* Turn-by-turn banner */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.navBanner}>
          <View style={styles.navIconWrap}>
            <Ionicons name={VEHICLE_ICON[driver.vehicle.type] ?? 'car-sport'} size={19} color={colors.white} />
          </View>
          <View style={{ flex: 1 }}>
            <Animated.View key={instruction} entering={FadeIn.duration(300)}>
              <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 14.5 }}>{instruction}</AppText>
            </Animated.View>
            <View style={styles.liveRow}>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.6)', fontSize: 10.5 }}>
                Turn-by-turn · CarPlay connected
              </AppText>
              <View style={styles.livePill}>
                <View style={[styles.liveDot, { backgroundColor: live.color }]} />
                <AppText variant="label" style={{ color: live.color, fontSize: 8.5, letterSpacing: 0.8 }}>{live.label}</AppText>
              </View>
            </View>
          </View>
          <AppText variant="num" style={{ color: colors.white, fontSize: 17 }}>{activeJob.estMinutes}′</AppText>
        </Animated.View>

        {/* Live map: own position, pickup, drop-off(s), traveled path */}
        <Animated.View entering={FadeInDown.delay(40).springify().damping(16)} style={{ marginBottom: 12 }}>
          <DriverMap
            live
            pickup={activeJob.pickupCoord}
            dropoff={activeJob.dropoffCoord}
            stops={(activeJob.extraStops ?? []).flatMap(s => (s.coord ? [s.coord] : []))}
            height={210}
          />
        </Animated.View>

        {/* Status card */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={styles.statusCard}>
          <Animated.View style={[styles.statusPulse, pulseStyle]}>
            <Ionicons name={stage.icon} size={26} color={colors.white} />
          </Animated.View>
          <AppText variant="h2" style={styles.statusLabel}>{stage.label}</AppText>
          <AppText variant="caption" style={styles.statusSub}>{activeJob.vendorName} · {activeJob.distance}</AppText>
          <View style={styles.segments}>
            {STAGES.slice(0, 3).map((s, i) => (
              <View key={s.id} style={[styles.segment, { backgroundColor: i <= stageIdx ? colors.white : 'rgba(255,255,255,0.25)' }]} />
            ))}
          </View>
        </Animated.View>

        {/* Merchant pickup notes (pre-pickup) */}
        {activeJob.status === 'accepted' && (
          <Animated.View entering={FadeInDown.delay(90).springify().damping(16)} style={styles.card}>
            <View style={styles.cardHeadRow}>
              <Ionicons name="storefront-outline" size={15} color={colors.primary} />
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Pickup instructions</AppText>
              <View style={[styles.codeChip, { backgroundColor: colors.primaryPale }]}>
                <AppText variant="bodyBold" style={{ color: colors.primary, fontSize: 11 }}>#{activeJob.orderCode}</AppText>
              </View>
            </View>
            <AppText variant="body" style={{ color: colors.textMuted, lineHeight: 20 }}>{activeJob.pickupDetail}</AppText>
            {isGrocery && (
              <Tappable onPress={() => nav.navigate('ShopChecklist')} style={[styles.shopBtn, { backgroundColor: colors.primary }]}>
                <Ionicons name="list-outline" size={16} color={colors.white} />
                <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 13.5 }}>Open shopping list · {activeJob.groceryItems!.length} items</AppText>
              </Tappable>
            )}
          </Animated.View>
        )}

        {/* Drop-off mode (en route) */}
        {activeJob.status === 'en_route' && (
          <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.card}>
            <View style={styles.cardHeadRow}>
              <Ionicons name={mode.icon} size={15} color={colors.primary} />
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{mode.label}</AppText>
              {activeJob.requiresPin && (
                <View style={[styles.codeChip, { backgroundColor: 'rgba(245,158,11,0.14)' }]}>
                  <AppText variant="bodyBold" style={{ color: colors.amber, fontSize: 11 }}>PIN required</AppText>
                </View>
              )}
            </View>
            <AppText variant="body" style={{ color: colors.textMuted, lineHeight: 20 }}>{mode.hint} — {activeJob.dropoffDetail}</AppText>
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={styles.card}>
          <RouteTrack colors={colors} pickupAddress={activeJob.pickup} pickupDetail={activeJob.pickupDetail} dropoffAddress={activeJob.dropoff} dropoffDetail={activeJob.dropoffDetail} />
        </Animated.View>

        {/* Customer */}
        <Animated.View entering={FadeInDown.delay(150).springify().damping(16)} style={[styles.card, styles.customerCard]}>
          <View style={styles.customerLeft}>
            <View style={styles.customerAvatar}>
              <AppText variant="h3" style={{ color: colors.white }}>{activeJob.customerName.charAt(0)}</AppText>
            </View>
            <View>
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{activeJob.customerName}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>Masked contact · in-app only</AppText>
            </View>
          </View>
          <View style={styles.customerActions}>
            <Pressable style={styles.customerBtn} onPress={() => nav.navigate('Chat')}>
              <Ionicons name="chatbubble-outline" size={17} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.customerBtn} onPress={() => nav.navigate('Chat')}>
              <Ionicons name="call-outline" size={17} color={colors.primary} />
            </Pressable>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).springify().damping(16)} style={styles.earningsRow}>
          <AppText variant="body" style={{ color: colors.textMuted }}>You'll earn</AppText>
          <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 20 }}>${(activeJob.payout + activeJob.tip).toFixed(2)}</AppText>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <View style={styles.ctaWrap}>
        {isFinalLeg ? (
          <SlideToConfirm label="Slide to complete" color={colors.primary} trackColor={colors.surfaceAlt} onConfirm={() => setCompleting(true)} />
        ) : (
          <Tappable onPress={advanceActiveJob} style={styles.primaryBtn}>
            <AppText variant="bodyBold" style={{ color: colors.white }}>{stage.action}</AppText>
          </Tappable>
        )}
      </View>

      {/* Completion verification sheet */}
      <Modal visible={completing} transparent animationType="fade" onRequestClose={() => setCompleting(false)}>
        <View style={styles.sheetBackdrop}>
          <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.sheet}>
            {activeJob.requiresPin ? (
              <>
                <AppText variant="h2" style={{ color: colors.textPrimary }}>Customer PIN</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
                  Ask {activeJob.customerName.split(' ')[0]} for their 4-digit code to hand over securely.
                </AppText>
                <Pressable onPress={() => pinRef.current?.focus()} style={styles.pinRow}>
                  {[0, 1, 2, 3].map(i => (
                    <View key={i} style={[styles.pinBox, { borderColor: pinError ? colors.red : pinInput.length === i ? colors.primary : colors.border }]}>
                      <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 24 }}>{pinInput[i] ?? ''}</AppText>
                    </View>
                  ))}
                </Pressable>
                <TextInput
                  ref={pinRef}
                  value={pinInput}
                  onChangeText={t => submitPin(t.replace(/\D/g, '').slice(0, 4))}
                  keyboardType="number-pad"
                  autoFocus
                  style={styles.hiddenInput}
                />
                {pinError && <AppText variant="caption" style={{ color: colors.red, marginTop: 4 }}>Wrong PIN — try again (hint: {activeJob.pin})</AppText>}
              </>
            ) : activeJob.dropoffMode === 'leave_at_door' ? (
              <>
                <AppText variant="h2" style={{ color: colors.textPrimary }}>Photo proof</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
                  Snap a photo of the order at the door to complete the drop-off.
                </AppText>
                <Pressable onPress={takePhoto} style={[styles.photoFrame, photoState === 'done' && { borderColor: colors.primary }]}>
                  {photoState === 'idle' && <Ionicons name="camera-outline" size={36} color={colors.textLight} />}
                  {photoState === 'snapping' && <Ionicons name="aperture-outline" size={36} color={colors.primary} />}
                  {photoState === 'done' && (
                    <View style={{ alignItems: 'center' }}>
                      <Ionicons name="image" size={36} color={colors.primary} />
                      <AppText variant="caption" style={{ color: colors.primary, marginTop: 6 }}>Photo captured ✓</AppText>
                    </View>
                  )}
                </Pressable>
                <Tappable
                  onPress={finish}
                  disabled={photoState !== 'done'}
                  style={[styles.sheetBtn, { backgroundColor: photoState === 'done' ? colors.primary : colors.surfaceAlt }]}
                >
                  <AppText variant="bodyBold" style={{ color: photoState === 'done' ? colors.white : colors.textLight }}>Complete delivery</AppText>
                </Tappable>
              </>
            ) : (
              <>
                <AppText variant="h2" style={{ color: colors.textPrimary }}>Confirm hand-off</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 6, textAlign: 'center' }}>
                  {mode.label}: confirm the customer received their order.
                </AppText>
                <Tappable onPress={finish} style={[styles.sheetBtn, { backgroundColor: colors.primary }]}>
                  <AppText variant="bodyBold" style={{ color: colors.white }}>Delivered to {activeJob.customerName.split(' ')[0]}</AppText>
                </Tappable>
              </>
            )}
            <Pressable onPress={() => setCompleting(false)} style={{ paddingVertical: 12 }}>
              <AppText variant="bodySemi" style={{ color: colors.textMuted }}>Back</AppText>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  refChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  content: { padding: spacing.md },

  queueStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.dark, ...cut.chip, padding: 12, marginBottom: 12,
  },
  queueBtn: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  queuedConfirm: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primaryPale, ...cut.chip, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },

  navBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.dark, ...cut.card, padding: spacing.md, marginBottom: 12,
  },
  navIconWrap: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 },
  livePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },
  liveDot: { width: 6, height: 6, borderRadius: 3 },

  statusCard: { alignItems: 'center', backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, marginBottom: 12 },
  statusPulse: { width: 56, height: 56, borderRadius: 28, backgroundColor: 'rgba(255,255,255,0.22)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statusLabel: { color: colors.white, textAlign: 'center' },
  statusSub: { color: 'rgba(255,255,255,0.85)', marginTop: 6 },
  segments: { flexDirection: 'row', gap: 6, marginTop: 18, width: '70%' },
  segment: { flex: 1, height: 4, borderRadius: 2 },

  card: { backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 12 },
  cardHeadRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  codeChip: { marginLeft: 'auto', borderRadius: 100, paddingHorizontal: 10, paddingVertical: 4 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 100, paddingVertical: 13, marginTop: 12 },

  customerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  customerActions: { flexDirection: 'row', gap: 8 },
  customerBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },

  earningsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: colors.surfaceAlt, ...cut.chip, padding: spacing.md, borderWidth: 1, borderColor: colors.border },

  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingBottom: spacing.lg },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: 30, height: 60, alignItems: 'center', justifyContent: 'center' },

  sheetBackdrop: { flex: 1, backgroundColor: 'rgba(4,10,18,0.82)', justifyContent: 'flex-end', padding: spacing.md, paddingBottom: 40 },
  sheet: { backgroundColor: colors.surface, ...cut.sheet, borderWidth: 1, borderColor: colors.border, padding: spacing.lg, alignItems: 'center' },
  pinRow: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 8 },
  pinBox: { width: 52, height: 60, borderRadius: 14, borderWidth: 2, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surfaceAlt },
  hiddenInput: { position: 'absolute', opacity: 0, height: 1, width: 1 },
  photoFrame: {
    width: 160, height: 120, borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border,
    alignItems: 'center', justifyContent: 'center', marginVertical: 20, backgroundColor: colors.surfaceAlt,
  },
  sheetBtn: { alignSelf: 'stretch', borderRadius: 30, paddingVertical: 15, alignItems: 'center', marginTop: 14 },

  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 12 },
  homeBtn: { backgroundColor: colors.primary, borderRadius: 30, paddingVertical: 12, paddingHorizontal: 26, marginTop: 8 },
})
