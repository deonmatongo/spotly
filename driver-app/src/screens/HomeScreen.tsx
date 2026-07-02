import React, { useEffect } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useDriver } from '../context/DriverContext'
import { useJobs } from '../context/JobsContext'
import { earningsSummary, JobType } from '../data/mock'
import { RootStackParamList } from '../navigation'
import JobCard from '../components/JobCard'
import PowerToggle from '../components/PowerToggle'
import Tappable from '../components/Tappable'
import AppText from '../components/AppText'
import OfferModal from '../components/OfferModal'
import SurgeMap from '../components/SurgeMap'
import useCountUp from '../hooks/useCountUp'

type Nav = NativeStackNavigationProp<RootStackParamList>

const FILTERS: { type: JobType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { type: 'food', label: 'Food', icon: 'restaurant-outline' },
  { type: 'groceries', label: 'Shop & Deliver', icon: 'bag-handle-outline' },
  { type: 'courier', label: 'Packages', icon: 'cube-outline' },
]

export default function HomeScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { driver, isOnline, setOnline, destination } = useDriver()
  const {
    visibleJobs, typeFilters, toggleTypeFilter, activeJob, declineJob,
    incomingOffer, spawnIncomingOffer, acceptIncomingOffer, declineIncomingOffer,
  } = useJobs()
  const todayEarn = useCountUp(earningsSummary.today.amount, 800)

  // Simulated dispatch: shortly after going online, a live offer pings in.
  useEffect(() => {
    if (!isOnline || activeJob || incomingOffer) return
    const t = setTimeout(spawnIncomingOffer, 7000)
    return () => clearTimeout(t)
  }, [isOnline, activeJob, incomingOffer])

  const acceptOffer = () => {
    acceptIncomingOffer()
    nav.navigate('ActiveDelivery')
  }

  return (
    <View style={styles.safe}>
      {incomingOffer && <OfferModal offer={incomingOffer} onAccept={acceptOffer} onDecline={declineIncomingOffer} />}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
            <View style={styles.heroSlash} />
            <View style={styles.heroSlashSmall} />

            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" style={{ color: 'rgba(255,255,255,0.75)' }}>Good to see you</AppText>
                <AppText variant="h1" style={{ color: colors.white, marginTop: 2 }}>{driver.firstName}</AppText>
              </View>
              <View style={styles.toggleBlock}>
                <PowerToggle
                  value={isOnline}
                  onChange={setOnline}
                  activeColor={colors.dark}
                  activeGlow={colors.white}
                  trackOff="rgba(255,255,255,0.22)"
                />
                <AppText variant="label" style={{ color: isOnline ? colors.white : 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: 9.5 }}>
                  {isOnline ? 'Online' : 'Offline'}
                </AppText>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statTicket}>
                <AppText variant="num" style={{ color: colors.white, fontSize: 26 }}>${todayEarn.toFixed(2)}</AppText>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Today</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statTicket}>
                <AppText variant="num" style={{ color: colors.white, fontSize: 26 }}>{earningsSummary.today.trips}</AppText>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Trips</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statTicket}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                  <AppText variant="num" style={{ color: colors.white, fontSize: 26 }}>{driver.rating}</AppText>
                  <Ionicons name="star" size={13} color={colors.amber} />
                </View>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Rating</AppText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          {/* Trip type filters */}
          <Animated.View entering={FadeIn.delay(60)} style={styles.filterRow}>
            {FILTERS.map(f => {
              const on = typeFilters[f.type]
              return (
                <Pressable
                  key={f.type}
                  onPress={() => toggleTypeFilter(f.type)}
                  style={[styles.filterChip, { borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primaryPale : colors.surface }]}
                >
                  <Ionicons name={f.icon} size={13} color={on ? colors.primary : colors.textLight} />
                  <AppText variant="bodySemi" style={{ color: on ? colors.primary : colors.textLight, fontSize: 12 }}>{f.label}</AppText>
                </Pressable>
              )
            })}
          </Animated.View>

          {destination.active && (
            <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.destStrip}>
              <Ionicons name="navigate-circle-outline" size={15} color={colors.primary} />
              <AppText variant="caption" style={{ color: colors.textPrimary, flex: 1 }}>
                Destination filter on — jobs toward <AppText variant="bodySemi" style={{ fontSize: 12 }}>{destination.address}</AppText>
              </AppText>
            </Animated.View>
          )}

          {activeJob && (
            <Animated.View entering={FadeInDown.delay(80).springify()}>
              <Tappable onPress={() => nav.navigate('ActiveDelivery')} style={styles.activeBanner}>
                <View style={styles.activeIconWrap}>
                  <Ionicons name="navigate" size={17} color={colors.white} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" style={{ color: colors.white }}>Delivery in progress</AppText>
                  <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.65)', marginTop: 2 }} numberOfLines={1}>
                    {activeJob.vendorName} → {activeJob.dropoff}
                  </AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.7)" />
              </Tappable>
            </Animated.View>
          )}

          {/* Demand map */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
            <AppText variant="h2" style={{ color: colors.textPrimary, flex: 1 }}>Demand near you</AppText>
          </View>
          <Animated.View entering={FadeInDown.delay(100).springify().damping(16)} style={{ marginBottom: spacing.md }}>
            <SurgeMap />
          </Animated.View>

          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
            <AppText variant="h2" style={{ color: colors.textPrimary, flex: 1 }}>Available jobs</AppText>
            <View style={[styles.countPill, { backgroundColor: colors.primaryPale }]}>
              <AppText variant="bodyBold" style={{ color: colors.primary, fontSize: 12 }}>{isOnline ? visibleJobs.length : 0}</AppText>
            </View>
          </View>

          {!isOnline ? (
            <EmptyState colors={colors} icon="power-outline" title="You're offline" sub="Flip the switch above to activate GPS and start receiving nearby delivery offers." />
          ) : visibleJobs.length === 0 ? (
            <EmptyState colors={colors} icon="cafe-outline" title="No jobs match your filters" sub="Widen your trip type filters or hang tight — new requests appear the moment they come in." />
          ) : (
            visibleJobs.map((job, i) => (
              <JobCard
                key={job.id}
                job={job}
                index={i}
                onPress={() => nav.navigate('JobDetail', { jobId: job.id })}
                onDecline={() => declineJob(job.id)}
              />
            ))
          )}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  )
}

function EmptyState({ colors, icon, title, sub }: { colors: Palette; icon: keyof typeof Ionicons.glyphMap; title: string; sub: string }) {
  return (
    <Animated.View entering={FadeIn.delay(150)} style={{ alignItems: 'center', padding: spacing.xl, backgroundColor: colors.surfaceAlt, ...cut.cardFlip, borderWidth: 1, borderColor: colors.border, borderStyle: 'dashed' }}>
      <Ionicons name={icon} size={30} color={colors.textLight} />
      <AppText variant="h3" style={{ color: colors.textPrimary, marginTop: 12 }}>{title}</AppText>
      <AppText variant="caption" style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6, lineHeight: 18 }}>{sub}</AppText>
    </Animated.View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { padding: spacing.md },

  hero: {
    borderTopLeftRadius: 0, borderTopRightRadius: 0,
    borderBottomRightRadius: 32, borderBottomLeftRadius: 8,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, overflow: 'hidden',
  },
  heroSlash: { position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '22deg' }] },
  heroSlashSmall: { position: 'absolute', bottom: -30, left: -20, width: 90, height: 90, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ rotate: '-10deg' }] },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  toggleBlock: { alignItems: 'center' },

  statRow: { flexDirection: 'row', alignItems: 'center' },
  statTicket: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.22)' },

  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.3, borderRadius: 100, paddingHorizontal: 12, paddingVertical: 8,
  },

  destStrip: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.primaryPale, ...cut.chip,
    paddingHorizontal: 12, paddingVertical: 10, marginBottom: 12,
  },

  activeBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.dark, ...cut.chip, padding: 14, marginBottom: spacing.md,
  },
  activeIconWrap: { width: 34, height: 34, borderRadius: 17, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },
  countPill: { minWidth: 26, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
})
