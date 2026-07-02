import React, { useEffect } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { proStatus } from '../data/mock'
import AppText from '../components/AppText'
import useCountUp from '../hooks/useCountUp'

export default function ProDashboardScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const points = useCountUp(proStatus.points, 900)
  const pct = proStatus.points / proStatus.nextTierPoints
  const grow = useSharedValue(0)

  useEffect(() => {
    grow.value = withDelay(250, withTiming(pct, { duration: 700, easing: Easing.out(Easing.cubic) }))
  }, [])

  const fillStyle = useAnimatedStyle(() => ({ width: `${grow.value * 100}%` }))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h3" style={{ color: colors.textPrimary }}>Spotly Pro</AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Tier card */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.tierCard}>
          <View style={styles.tierSlash} />
          <View style={styles.tierBadge}>
            <Ionicons name="medal" size={14} color="#B45309" />
            <AppText variant="label" style={{ color: '#B45309', fontSize: 10, marginLeft: 4 }}>{proStatus.tier} tier</AppText>
          </View>
          <AppText variant="display" style={{ color: colors.white, fontSize: 40, marginTop: 10 }}>{Math.round(points)}</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.8)' }}>Pro points this period</AppText>

          <View style={styles.tierTrack}>
            <Animated.View style={[styles.tierFill, fillStyle]} />
          </View>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 8 }}>
            {proStatus.nextTierPoints - proStatus.points} points to {proStatus.nextTier}
          </AppText>
        </Animated.View>

        {/* Stats */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={styles.statsRow}>
          <View style={styles.statCard}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>{proStatus.acceptanceRate}%</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>Acceptance</AppText>
          </View>
          <View style={styles.statCard}>
            <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
              <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 22 }}>{proStatus.satisfaction}</AppText>
              <Ionicons name="star" size={12} color={colors.amber} />
            </View>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>Satisfaction</AppText>
          </View>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Tier perks</AppText>
        </View>

        {proStatus.perks.map((perk, i) => (
          <Animated.View key={perk.id} entering={FadeInDown.delay(140 + i * 70).springify().damping(16)} style={[styles.perkRow, !perk.unlocked && { opacity: 0.55 }]}>
            <View style={[styles.perkIcon, { backgroundColor: perk.unlocked ? colors.primaryPale : colors.surfaceAlt }]}>
              <Ionicons name={perk.unlocked ? 'checkmark' : 'lock-closed'} size={15} color={perk.unlocked ? colors.primary : colors.textLight} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>{perk.label}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{perk.tier} tier{perk.unlocked ? ' · active' : ''}</AppText>
            </View>
          </Animated.View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md },

  tierCard: { backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, alignItems: 'center', marginBottom: 12, overflow: 'hidden' },
  tierSlash: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '25deg' }] },
  tierBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FCD34D', borderRadius: 100, paddingHorizontal: 12, paddingVertical: 5 },
  tierTrack: { width: '80%', height: 7, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginTop: 16 },
  tierFill: { height: 7, borderRadius: 4, backgroundColor: colors.white },

  statsRow: { flexDirection: 'row', gap: 12, marginBottom: spacing.md },
  statCard: { flex: 1, backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, alignItems: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },

  perkRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 10 },
  perkIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
})
