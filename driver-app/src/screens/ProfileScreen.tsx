import React from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useDriver } from '../context/DriverContext'
import { useAuth } from '../context/AuthContext'
import { proStatus, plusCard, documentsWallet } from '../data/mock'
import { RootStackParamList } from '../navigation'
import AppText from '../components/AppText'
import PowerToggle from '../components/PowerToggle'
import Tappable from '../components/Tappable'

type Nav = NativeStackNavigationProp<RootStackParamList>

const DOC_STATUS = {
  verified: { label: 'Verified', color: '#16A34A' },
  expiring: { label: 'Renew soon', color: '#F59E0B' },
  action_needed: { label: 'Action needed', color: '#EF4444' },
}

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { driver } = useDriver()
  const { logout } = useAuth()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.header}>
          <View style={styles.headerSlash} />
          <View style={styles.avatar}>
            <AppText variant="display" style={{ color: colors.white, fontSize: 28 }}>{driver.initial}</AppText>
          </View>
          <AppText variant="h1" style={{ color: colors.white, marginTop: 12 }}>{driver.name}</AppText>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={13} color={colors.amber} />
            <AppText variant="bodySemi" style={{ color: 'rgba(255,255,255,0.85)' }}>{driver.rating} · {driver.totalTrips.toLocaleString()} trips</AppText>
          </View>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.55)', marginTop: 6 }}>Driving with Spotly since {driver.memberSince}</AppText>
        </Animated.View>

        {/* Pro dashboard */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)}>
          <Tappable onPress={() => nav.navigate('ProDashboard')} style={styles.proCard}>
            <View style={[styles.proBadge, { backgroundColor: '#FCD34D' }]}>
              <Ionicons name="medal" size={16} color="#B45309" />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Spotly Pro · {proStatus.tier}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                {proStatus.points} pts · {proStatus.acceptanceRate}% acceptance · {proStatus.satisfaction}★
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </Tappable>
        </Animated.View>

        {/* Safety hub */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(16)}>
          <Tappable onPress={() => nav.navigate('SafetyHub')} style={styles.proCard}>
            <View style={[styles.proBadge, { backgroundColor: colors.primaryPale }]}>
              <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Safety Hub</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                RideCheck active · Selfie ID verified {driver.lastSelfieCheck}
              </AppText>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
          </Tappable>
        </Animated.View>

        {/* Plus card */}
        <Animated.View entering={FadeInDown.delay(140).springify().damping(16)} style={styles.plusCard}>
          <View style={styles.rowBetween}>
            <AppText variant="label" style={{ color: 'rgba(255,255,255,0.8)' }}>Spotly Plus Card</AppText>
            <Ionicons name="card" size={18} color={colors.white} />
          </View>
          <AppText variant="num" style={{ color: colors.white, fontSize: 26, marginTop: 8 }}>${plusCard.balance.toFixed(2)}</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>
            •••• {plusCard.last4} · pre-funded for Shop & Deliver orders
          </AppText>
        </Animated.View>

        {/* Vehicle */}
        <Section colors={colors} label="Vehicle" delay={180} trailing={
          <View style={[styles.verifiedPill, { backgroundColor: colors.primaryPale }]}>
            <Ionicons name="checkmark-circle" size={12} color={colors.primary} />
            <AppText variant="label" style={{ color: colors.primary, fontSize: 9.5, marginLeft: 3 }}>Verified</AppText>
          </View>
        }>
          <Row colors={colors} icon="car-outline" label={driver.vehicle.make} value={driver.vehicle.color} />
          <Row colors={colors} icon="pricetag-outline" label="Plate" value={driver.vehicle.plate} />
          <Row colors={colors} icon="phone-portrait-outline" label="CarPlay / Android Auto" value="Connected" last />
        </Section>

        {/* Documents wallet */}
        <Section colors={colors} label="Document wallet" delay={220}>
          {documentsWallet.map((doc, i) => {
            const meta = DOC_STATUS[doc.status]
            return (
              <View key={doc.id} style={[styles.docRow, i === documentsWallet.length - 1 && { borderBottomWidth: 0 }]}>
                <View style={{ flex: 1 }}>
                  <AppText variant="body" style={{ color: colors.textPrimary }}>{doc.label}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>Expires {doc.expires}</AppText>
                </View>
                <View style={[styles.statusChip, { backgroundColor: meta.color + '22' }]}>
                  <AppText variant="label" style={{ color: meta.color, fontSize: 9.5 }}>{meta.label}</AppText>
                </View>
              </View>
            )
          })}
        </Section>

        <Section colors={colors} label="Contact" delay={260}>
          <Row colors={colors} icon="mail-outline" label="Email" value={driver.email} />
          <Row colors={colors} icon="call-outline" label="Phone" value={driver.phone} last />
        </Section>

        <Animated.View entering={FadeInDown.delay(300).springify().damping(16)} style={styles.toggleRow}>
          <View style={styles.toggleLeft}>
            <Ionicons name="moon-outline" size={18} color={colors.textPrimary} />
            <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>Dark mode</AppText>
          </View>
          <PowerToggle value={isDark} onChange={toggle} activeColor={colors.primary} activeGlow={colors.primaryLight} trackOff={colors.border} />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(340).springify().damping(16)}>
          <Tappable onPress={logout} style={styles.signOutBtn}>
            <AppText variant="bodyBold" style={{ color: colors.red }}>Sign out</AppText>
          </Tappable>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function Section({ colors, label, delay, trailing, children }: { colors: Palette; label: string; delay: number; trailing?: React.ReactNode; children: React.ReactNode }) {
  const styles = makeStyles(colors)
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(16)} style={styles.sectionCard}>
      <View style={styles.sectionHeadRow}>
        <AppText variant="label" style={{ color: colors.textMuted }}>{label}</AppText>
        {trailing}
      </View>
      {children}
    </Animated.View>
  )
}

function Row({ colors, icon, label, value, last }: { colors: Palette; icon: keyof typeof Ionicons.glyphMap; label: string; value: string; last?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.divider }}>
      <Ionicons name={icon} size={16} color={colors.textMuted} />
      <AppText variant="body" style={{ color: colors.textMuted, flex: 1 }}>{label}</AppText>
      <AppText variant="bodySemi" style={{ color: colors.textPrimary, flexShrink: 1, textAlign: 'right' }} numberOfLines={1}>{value}</AppText>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md },

  header: { backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, alignItems: 'center', marginBottom: spacing.md, overflow: 'hidden' },
  headerSlash: { position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '25deg' }] },
  avatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.3)' },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },

  proCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: 10,
  },
  proBadge: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },

  plusCard: { backgroundColor: colors.dark, ...cut.card, padding: spacing.md, marginBottom: spacing.md, marginTop: 4 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  sectionCard: { backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  sectionHeadRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  verifiedPill: { flexDirection: 'row', alignItems: 'center', borderRadius: 100, paddingHorizontal: 8, paddingVertical: 3 },

  docRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.divider },
  statusChip: { borderRadius: 100, paddingHorizontal: 9, paddingVertical: 4 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  toggleLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },

  signOutBtn: { alignItems: 'center', paddingVertical: 16, borderRadius: 30, backgroundColor: colors.redLight },
})
