import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Modal, Switch } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius, shadow, typography } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { currentUser } from '../data/mock'
import { RootStackParamList } from '../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList>

const REWARDS = [
  { id: 1, name: '$10 off any booking', points: 500 },
  { id: 2, name: 'Free delivery (7 days)', points: 300 },
  { id: 3, name: 'Priority reservations', points: 800 },
  { id: 4, name: 'VIP event access', points: 1200 },
]

const ACCOUNT_ITEMS = [
  { icon: 'heart-outline' as const, label: 'Saved venues', nav: 'Favorites' as const },
  { icon: 'ticket-outline' as const, label: 'My Tickets', nav: 'MyTickets' as const },
  { icon: 'star-outline' as const, label: 'My Reviews', nav: 'Reviews' as const },
  { icon: 'pricetag-outline' as const, label: 'Offers & Promos', nav: 'Offers' as const },
  { icon: 'notifications-outline' as const, label: 'Notifications', nav: 'Notifications' as const },
  { icon: 'card-outline' as const, label: 'Payment methods', nav: null },
  { icon: 'location-outline' as const, label: 'Saved addresses', nav: null },
  { icon: 'shield-checkmark-outline' as const, label: 'Privacy & Security', nav: null },
  { icon: 'chatbubble-ellipses-outline' as const, label: 'Help & Support', nav: 'Support' as const },
]

export default function ProfileScreen() {
  const { colors, isDark, toggle } = useTheme()
  const styles = makeStyles(colors)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<Nav>()
  const [redeemModal, setRedeemModal] = useState<typeof REWARDS[0] | null>(null)
  const [redeemed, setRedeemed] = useState<number[]>([])
  const progress = currentUser.points / currentUser.nextTierPoints

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 80 }]} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarInitial}>{currentUser.initial}</Text>
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.name}>{currentUser.name}</Text>
            <Text style={styles.email}>{currentUser.email}</Text>
          </View>
        </View>

        {/* Points card */}
        <LinearGradient colors={['#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.pointsCard}>
          <View style={styles.pointsTop}>
            <View>
              <Text style={styles.pointsLabel}>Spotly Points</Text>
              <Text style={styles.pointsValue}>{currentUser.points.toLocaleString()}</Text>
            </View>
            <View style={styles.sparkleIcon}>
              <Ionicons name="sparkles" size={24} color="rgba(255,255,255,0.9)" />
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(progress * 100, 100)}%` as any }]} />
          </View>
          <Text style={styles.progressText}>
            {(currentUser.nextTierPoints - currentUser.points).toLocaleString()} pts until your next reward tier
          </Text>
        </LinearGradient>

        {/* Rewards */}
        <Text style={styles.sectionTitle}>Rewards</Text>
        <View style={styles.rewardsGrid}>
          {REWARDS.map(reward => {
            const canRedeem = currentUser.points >= reward.points
            const isRedeemed = redeemed.includes(reward.id)
            return (
              <View key={reward.id} style={styles.rewardCard}>
                <Ionicons name="gift-outline" size={24} color={colors.primary} style={{ marginBottom: 8 }} />
                <Text style={styles.rewardName}>{reward.name}</Text>
                <Text style={styles.rewardPoints}>{reward.points} pts</Text>
                <Pressable
                  onPress={() => canRedeem && !isRedeemed && setRedeemModal(reward)}
                  style={[styles.redeemBtn, (!canRedeem || isRedeemed) && styles.redeemBtnDisabled]}
                >
                  <Text style={[styles.redeemText, (!canRedeem || isRedeemed) && styles.redeemTextDisabled]}>
                    {isRedeemed ? 'Redeemed' : 'Redeem'}
                  </Text>
                </Pressable>
              </View>
            )
          })}
        </View>

        {/* Appearance */}
        <Text style={styles.sectionTitle}>Appearance</Text>
        <View style={styles.accountList}>
          <View style={styles.accountRow}>
            <View style={styles.accountRowLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={18} color={colors.primary} />
              <Text style={styles.accountLabel}>Dark mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggle}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={colors.white}
              ios_backgroundColor={colors.border}
            />
          </View>
        </View>

        {/* Account */}
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.accountList}>
          {ACCOUNT_ITEMS.map(({ icon, label, nav: dest }, i) => (
            <View key={label}>
              <Pressable
                style={styles.accountRow}
                android_ripple={{ color: colors.divider }}
                onPress={() => dest && nav.navigate(dest as any)}
              >
                <View style={styles.accountRowLeft}>
                  <Ionicons name={icon} size={18} color={colors.textMuted} />
                  <Text style={styles.accountLabel}>{label}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
              </Pressable>
              {i < ACCOUNT_ITEMS.length - 1 && <View style={styles.divider} />}
            </View>
          ))}
        </View>

        {/* Sign out */}
        <Pressable style={styles.signOutBtn}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>

      </ScrollView>

      {/* Redeem modal */}
      <Modal visible={!!redeemModal} transparent animationType="slide" onRequestClose={() => setRedeemModal(null)}>
        <Pressable style={styles.overlay} onPress={() => setRedeemModal(null)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Ionicons name="gift-outline" size={40} color={colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
          <Text style={styles.sheetTitle}>{redeemModal?.name}</Text>
          <Text style={styles.sheetSub}>
            This will use {redeemModal?.points} of your {currentUser.points.toLocaleString()} points
          </Text>
          <Pressable
            style={styles.sheetConfirm}
            onPress={() => { if (redeemModal) { setRedeemed(prev => [...prev, redeemModal.id]); setRedeemModal(null) } }}
          >
            <Text style={styles.sheetConfirmText}>Redeem {redeemModal?.points} Points</Text>
          </Pressable>
          <Pressable style={styles.sheetCancel} onPress={() => setRedeemModal(null)}>
            <Text style={styles.sheetCancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  content: { paddingBottom: 0 },

  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: spacing.md },
  avatarWrap: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: colors.primary },
  userInfo: { flex: 1 },
  name: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  email: { fontSize: 14, color: colors.textMuted, marginTop: 2 },

  pointsCard: { marginHorizontal: spacing.md, borderRadius: radius.xl, padding: spacing.md, marginBottom: spacing.md },
  pointsTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  pointsLabel: { fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: '500', marginBottom: 4 },
  pointsValue: { fontSize: 40, fontWeight: '800', color: colors.white, letterSpacing: -1 },
  sparkleIcon: { width: 44, height: 44, backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  progressBar: { height: 6, backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: colors.white, borderRadius: 3 },
  progressText: { fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: '500' },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginHorizontal: spacing.md, marginTop: 4, marginBottom: 12 },

  rewardsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, gap: 12, marginBottom: spacing.md },
  rewardCard: { width: '47%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14 },
  rewardName: { fontSize: 14, fontWeight: '600', color: colors.textPrimary, marginBottom: 4, lineHeight: 20 },
  rewardPoints: { fontSize: 13, color: colors.textMuted, marginBottom: 12 },
  redeemBtn: { backgroundColor: colors.primaryPale, borderRadius: radius.md, paddingVertical: 8, alignItems: 'center' },
  redeemBtnDisabled: { backgroundColor: colors.divider },
  redeemText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  redeemTextDisabled: { color: colors.textLight },

  accountList: { marginHorizontal: spacing.md, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginBottom: spacing.md },
  accountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 16 },
  accountRowLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  accountLabel: { fontSize: 15, color: colors.textPrimary, fontWeight: '400' },
  divider: { height: 1, backgroundColor: colors.divider, marginLeft: spacing.md },

  signOutBtn: { marginHorizontal: spacing.md, paddingVertical: 14, alignItems: 'center' },
  signOutText: { fontSize: 15, color: colors.red, fontWeight: '600' },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: spacing.md },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary, textAlign: 'center', marginBottom: 8 },
  sheetSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  sheetConfirm: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 12 },
  sheetConfirmText: { fontSize: 15, fontWeight: '700', color: colors.white },
  sheetCancel: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  sheetCancelText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
})
