import React from 'react'
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useJobs } from '../context/JobsContext'
import { RootStackParamList } from '../navigation'
import RouteTrack from '../components/RouteTrack'
import DriverMap from '../components/DriverMap'
import SlideToConfirm from '../components/SlideToConfirm'
import AppText from '../components/AppText'
import useCountUp from '../hooks/useCountUp'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'JobDetail'>

export default function JobDetailScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { jobId } = useRoute<Route>().params
  const { availableJobs, acceptJob, declineJob } = useJobs()

  const job = availableJobs.find(j => j.id === jobId)
  const total = job ? job.payout + job.tip : 0
  const animatedTotal = useCountUp(total, 700)

  if (!job) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <TopBar colors={colors} onBack={() => nav.goBack()} />
        <View style={styles.emptyWrap}>
          <AppText variant="body" style={{ color: colors.textMuted }}>This job is no longer available.</AppText>
        </View>
      </SafeAreaView>
    )
  }

  const accept = () => {
    acceptJob(job.id)
    nav.replace('ActiveDelivery')
  }

  const decline = () => {
    declineJob(job.id)
    nav.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <TopBar colors={colors} onBack={() => nav.goBack()} />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.payoutCard}>
          <View style={styles.payoutSlash} />
          <AppText variant="label" style={{ color: 'rgba(255,255,255,0.8)' }}>You'll earn</AppText>
          <AppText variant="display" style={styles.payoutValue}>${animatedTotal.toFixed(2)}</AppText>
          {(job.tip > 0 || !!job.surge || !!job.boost) && (
            <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>
              {[
                job.tip > 0 ? `$${job.tip.toFixed(2)} expected tip` : null,
                job.surge && job.surge > 1 ? `${job.surge}× surge` : null,
                job.boost ? `$${job.boost.toFixed(2)} boost` : null,
              ].filter(Boolean).join(' · ')}
            </AppText>
          )}
          <View style={styles.payoutMetaRow}>
            <View style={styles.payoutMetaItem}>
              <Ionicons name="navigate-outline" size={13} color="rgba(255,255,255,0.85)" />
              <AppText variant="bodySemi" style={styles.payoutMetaText}>{job.distance}</AppText>
            </View>
            <View style={styles.payoutMetaItem}>
              <Ionicons name="time-outline" size={13} color="rgba(255,255,255,0.85)" />
              <AppText variant="bodySemi" style={styles.payoutMetaText}>~{job.estMinutes} min</AppText>
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={{ marginBottom: spacing.md }}>
          <DriverMap
            pickup={job.pickupCoord}
            dropoff={job.dropoffCoord}
            stops={(job.extraStops ?? []).flatMap(s => (s.coord ? [s.coord] : []))}
            height={170}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={styles.card}>
          <RouteTrack colors={colors} pickupAddress={job.pickup} pickupDetail={job.pickupDetail} dropoffAddress={job.dropoff} dropoffDetail={job.dropoffDetail} />
        </Animated.View>

        {!!job.extraStops?.length && (
          <Animated.View entering={FadeInDown.delay(110).springify().damping(16)} style={styles.card}>
            <View style={styles.stackedHeader}>
              <Ionicons name="layers-outline" size={15} color={colors.primary} />
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Stacked order · {job.extraStops.length + 1} drop-offs</AppText>
            </View>
            {job.extraStops.map((stop, i) => (
              <View key={stop.address} style={styles.stopRow}>
                <View style={[styles.stopNum, { backgroundColor: colors.primaryPale }]}>
                  <AppText variant="bodyBold" style={{ color: colors.primary, fontSize: 11 }}>{i + 2}</AppText>
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>{stop.address}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{stop.customerName} · {stop.detail}</AppText>
                </View>
              </View>
            ))}
          </Animated.View>
        )}

        <Animated.View entering={FadeInDown.delay(150).springify().damping(16)} style={[styles.card, styles.customerCard]}>
          <View style={styles.customerLeft}>
            <View style={styles.customerAvatar}>
              <AppText variant="h3" style={{ color: colors.white }}>{job.customerName.charAt(0)}</AppText>
            </View>
            <View>
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{job.customerName}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{job.itemsSummary}</AppText>
            </View>
          </View>
          <Pressable style={styles.callBtn} onPress={() => Linking.openURL(`tel:${job.customerPhone}`)}>
            <Ionicons name="call-outline" size={17} color={colors.primary} />
          </Pressable>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      <Animated.View entering={FadeIn.delay(200)} style={styles.ctaWrap}>
        <Pressable onPress={decline} style={styles.declineChip}>
          <AppText variant="bodySemi" style={{ color: colors.red }}>Decline</AppText>
        </Pressable>
        <View style={{ flex: 1 }}>
          <SlideToConfirm label="Slide to accept" color={colors.primary} trackColor={colors.surfaceAlt} onConfirm={accept} />
        </View>
      </Animated.View>
    </SafeAreaView>
  )
}

function TopBar({ colors, onBack }: { colors: Palette; onBack: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      <Pressable onPress={onBack} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
      </Pressable>
      <AppText variant="h3" style={{ color: colors.textPrimary }}>Job details</AppText>
      <View style={{ width: 36 }} />
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },

  payoutCard: { backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, overflow: 'hidden' },
  payoutSlash: { position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '20deg' }] },
  payoutValue: { color: colors.white, fontSize: 46, marginVertical: 4 },
  payoutMetaRow: { flexDirection: 'row', gap: 20, marginTop: 14 },
  payoutMetaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  payoutMetaText: { color: 'rgba(255,255,255,0.9)' },

  card: { backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  customerCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  customerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  customerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },

  stackedHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  stopRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 8 },
  stopNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  ctaWrap: { flexDirection: 'row', gap: 10, alignItems: 'center', position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingBottom: spacing.lg },
  declineChip: { paddingHorizontal: 16, height: 60, alignItems: 'center', justifyContent: 'center', borderRadius: 30, backgroundColor: colors.redLight },
})
