import React from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useStore } from '../context/StoreContext'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

interface RowProps {
  icon: string
  label: string
  value?: string
  onPress?: () => void
  colors: Palette
  danger?: boolean
}

function SettingsRow({ icon, label, value, onPress, colors, danger }: RowProps) {
  const color = danger ? colors.red : colors.textPrimary
  return (
    <Pressable onPress={onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.divider }}>
      <View style={{ width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center', backgroundColor: danger ? colors.redLight : colors.surfaceAlt }}>
        <Ionicons name={icon as any} size={16} color={danger ? colors.red : colors.textSecondary} />
      </View>
      <AppText variant="bodySemi" style={{ color, flex: 1 }}>{label}</AppText>
      {value ? (
        <AppText variant="caption" style={{ color: colors.textMuted }}>{value}</AppText>
      ) : (
        <Ionicons name="chevron-forward" size={15} color={danger ? colors.red : colors.textLight} />
      )}
    </Pressable>
  )
}

export default function ProfileScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { logout } = useAuth()
  const { store, isOpen, toggleOpen } = useStore()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Store header */}
        <Animated.View entering={FadeInDown.springify().damping(16)}>
          <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.profileHero}>
            <View style={styles.heroSlash} />
            <View style={styles.storeAvatar}>
              <Ionicons name="storefront" size={30} color="#fff" />
            </View>
            <AppText variant="h1" style={{ color: '#fff', marginTop: 14 }}>{store.name}</AppText>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={13} color="#FCD34D" />
              <AppText variant="bodySemi" style={{ color: 'rgba(255,255,255,0.9)', fontSize: 13 }}>{store.rating}</AppText>
              <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>· {store.totalOrders.toLocaleString()} orders</AppText>
            </View>
            <View style={styles.openRow}>
              <View style={[styles.openDot, { backgroundColor: isOpen ? '#4ADE80' : '#94A3B8' }]} />
              <AppText variant="label" style={{ color: isOpen ? '#4ADE80' : 'rgba(255,255,255,0.6)', fontSize: 10 }}>
                {isOpen ? 'Store is open' : 'Store is closed'}
              </AppText>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Store details */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="label" style={{ color: colors.textLight, marginBottom: 12 }}>Store details</AppText>
          <View style={styles.detailRow}>
            <Ionicons name="location-outline" size={14} color={colors.textLight} />
            <AppText variant="body" style={{ color: colors.textSecondary, flex: 1 }}>{store.address}</AppText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="mail-outline" size={14} color={colors.textLight} />
            <AppText variant="body" style={{ color: colors.textSecondary }}>{store.email}</AppText>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="call-outline" size={14} color={colors.textLight} />
            <AppText variant="body" style={{ color: colors.textSecondary }}>{store.phone}</AppText>
          </View>
          <View style={[styles.detailRow, { borderBottomWidth: 0 }]}>
            <Ionicons name="timer-outline" size={14} color={colors.textLight} />
            <AppText variant="body" style={{ color: colors.textSecondary }}>Avg prep time: {store.avgPrepTime} min</AppText>
          </View>
        </Animated.View>

        {/* Settings */}
        <Animated.View entering={FadeInDown.delay(100).springify().damping(16)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="label" style={{ color: colors.textLight, marginBottom: 12 }}>Store settings</AppText>
          <SettingsRow icon="storefront-outline" label="Store status" value={isOpen ? 'Open' : 'Closed'} onPress={toggleOpen} colors={colors} />
          <SettingsRow icon="time-outline" label="Opening hours" value="7:00 AM – 10:00 PM" colors={colors} />
          <SettingsRow icon="navigate-circle-outline" label="Delivery radius" value={store.coverageRadius} colors={colors} />
          <SettingsRow icon="card-outline" label="Bank account" value={store.bankAccount} colors={colors} />
          <SettingsRow icon="star-outline" label="Reviews" colors={colors} />
        </Animated.View>

        {/* Account */}
        <Animated.View entering={FadeInDown.delay(130).springify().damping(16)} style={[styles.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="label" style={{ color: colors.textLight, marginBottom: 12 }}>Account</AppText>
          <SettingsRow icon="shield-checkmark-outline" label="Security" colors={colors} />
          <SettingsRow icon="help-circle-outline" label="Support" colors={colors} />
          <SettingsRow icon="document-text-outline" label="Terms & privacy" colors={colors} />
          <SettingsRow icon="log-out-outline" label="Sign out" onPress={logout} colors={colors} danger />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160)}>
          <AppText variant="label" style={{ textAlign: 'center', fontSize: 9.5, letterSpacing: 2, color: colors.textLight, marginBottom: spacing.xl }}>
            Spotly Merchant · Member since {store.memberSince}
          </AppText>
        </Animated.View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },

  profileHero: {
    alignItems: 'center', paddingTop: spacing.xl, paddingBottom: spacing.xl,
    borderBottomRightRadius: 32, borderBottomLeftRadius: 8, overflow: 'hidden',
  },
  heroSlash: { position: 'absolute', top: -60, right: -60, width: 180, height: 180, borderRadius: 54, backgroundColor: 'rgba(255,255,255,0.07)', transform: [{ rotate: '22deg' }] },
  storeAvatar: {
    width: 76, height: 76, backgroundColor: 'rgba(255,255,255,0.2)',
    borderTopLeftRadius: 26, borderTopRightRadius: 10, borderBottomRightRadius: 26, borderBottomLeftRadius: 10,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 6 },
  openRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  openDot: { width: 7, height: 7, borderRadius: 4 },

  section: { margin: spacing.md, marginBottom: 0, ...cut.card, borderWidth: 1, padding: spacing.md },
  detailRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider },
})
