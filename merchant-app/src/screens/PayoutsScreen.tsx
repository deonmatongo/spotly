import React from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { revenueSummary, payoutHistory } from '../data/mock'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'
import useCountUp from '../hooks/useCountUp'

export default function PayoutsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const pending = useCountUp(revenueSummary.pendingPayout, 700)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h1" style={{ color: colors.textPrimary }}>Payouts</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Balance card */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.balanceCard}>
          <View style={styles.balanceSlash} />
          <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>Pending payout</AppText>
          <AppText variant="display" style={{ color: '#fff', fontSize: 40, marginVertical: 6 }}>${pending.toFixed(2)}</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Auto-payout on {revenueSummary.nextPayoutDate} · Platform fee {(revenueSummary.platformFeeRate * 100).toFixed(0)}%
          </AppText>
          <Tappable onPress={() => {}} style={styles.cashOutBtn}>
            <Ionicons name="flash" size={14} color={colors.primary} />
            <AppText variant="bodyBold" style={{ color: colors.primary, fontSize: 14 }}>Request early payout</AppText>
          </Tappable>
        </Animated.View>

        {/* Info strip */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={[styles.infoStrip, { backgroundColor: colors.bluePale, borderColor: colors.blue + '44' }]}>
          <Ionicons name="information-circle-outline" size={16} color={colors.blue} />
          <AppText variant="caption" style={{ color: colors.blue, flex: 1, lineHeight: 18 }}>
            Payouts are sent every Monday. Platform fee of {(revenueSummary.platformFeeRate * 100).toFixed(0)}% is deducted automatically.
          </AppText>
        </Animated.View>

        {/* History */}
        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Payout history</AppText>
        </View>

        {payoutHistory.map((record, i) => (
          <Animated.View key={record.id} entering={FadeInDown.delay(80 + i * 55).springify().damping(16)}>
            <View style={[styles.recordRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.recordStub} />
              <View style={[styles.recordIcon, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name="wallet" size={14} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Week of {record.period}</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>Paid on {record.date}</AppText>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 16 }}>${record.amount.toFixed(2)}</AppText>
                <View style={[styles.paidBadge, { backgroundColor: colors.primaryPale }]}>
                  <AppText variant="label" style={{ fontSize: 8.5, color: colors.primary, letterSpacing: 0.5 }}>PAID</AppText>
                </View>
              </View>
            </View>
          </Animated.View>
        ))}

        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md },

  balanceCard: { backgroundColor: colors.primary, ...cut.sheet, padding: spacing.lg, marginBottom: spacing.md, overflow: 'hidden' },
  balanceSlash: { position: 'absolute', bottom: -40, left: -30, width: 120, height: 120, borderRadius: 36, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-15deg' }] },
  cashOutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 100, paddingVertical: 13, marginTop: 16 },

  infoStrip: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderWidth: 1, ...cut.chip, paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.md },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 4 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },

  recordRow: { flexDirection: 'row', alignItems: 'center', gap: 12, ...cut.chip, borderWidth: 1, padding: 14, marginBottom: 10, position: 'relative', overflow: 'hidden' },
  recordStub: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: colors.primary },
  recordIcon: { width: 30, height: 30, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  paidBadge: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100 },
})
