import React, { useEffect, useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useDriver } from '../context/DriverContext'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

export default function SafetyHubScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const { driver } = useDriver()
  const [selfieState, setSelfieState] = useState<'idle' | 'checking' | 'done'>('idle')
  const pulse = useSharedValue(0)

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1400, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const pulseStyle = useAnimatedStyle(() => ({ opacity: 0.5 + pulse.value * 0.5 }))

  const runSelfieCheck = () => {
    setSelfieState('checking')
    setTimeout(() => setSelfieState('done'), 1400)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h3" style={{ color: colors.textPrimary }}>Safety Hub</AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* RideCheck */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.rideCheckCard}>
          <View style={styles.rideCheckTop}>
            <Animated.View style={[styles.liveDot, pulseStyle, { backgroundColor: colors.primaryLight }]} />
            <AppText variant="label" style={{ color: 'rgba(255,255,255,0.85)' }}>RideCheck active</AppText>
          </View>
          <AppText variant="h2" style={{ color: colors.white, marginTop: 8 }}>We're watching out for you</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 6, lineHeight: 18 }}>
            Sensors monitor every trip for long unexpected stops or possible crashes. If something looks off, we check in and can connect you to emergency support.
          </AppText>
        </Animated.View>

        {/* Emergency */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}>
          <Tappable style={styles.sosBtn} onPress={() => Linking.openURL('tel:999')}>
            <Ionicons name="alert-circle" size={20} color={colors.white} />
            <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 15 }}>Emergency assist · call 999</AppText>
          </Tappable>
        </Animated.View>

        {/* Selfie ID */}
        <Animated.View entering={FadeInDown.delay(140).springify().damping(16)} style={styles.card}>
          <View style={styles.rowBetween}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name="scan-outline" size={18} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Selfie ID verification</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                  {selfieState === 'done' ? 'Verified just now ✓' : `Last verified ${driver.lastSelfieCheck}`}
                </AppText>
              </View>
            </View>
            <Tappable
              onPress={runSelfieCheck}
              style={[styles.smallBtn, { backgroundColor: selfieState === 'done' ? colors.primaryPale : colors.primary }]}
            >
              <AppText variant="bodyBold" style={{ color: selfieState === 'done' ? colors.primary : colors.white, fontSize: 12 }}>
                {selfieState === 'checking' ? 'Checking…' : selfieState === 'done' ? 'Verified' : 'Verify now'}
              </AppText>
            </Tappable>
          </View>
        </Animated.View>

        {/* Other tools */}
        {[
          { icon: 'share-social-outline' as const, title: 'Share trip status', sub: 'Let a trusted contact follow your live location' },
          { icon: 'document-text-outline' as const, title: 'Report a safety incident', sub: 'Flag anything that happened on a recent trip' },
          { icon: 'shield-checkmark-outline' as const, title: 'Insurance on every trip', sub: 'Coverage is active whenever you\'re on a delivery' },
        ].map((row, i) => (
          <Animated.View key={row.title} entering={FadeInDown.delay(200 + i * 70).springify().damping(16)} style={styles.card}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={[styles.iconWrap, { backgroundColor: colors.surfaceAlt }]}>
                <Ionicons name={row.icon} size={18} color={colors.textPrimary} />
              </View>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{row.title}</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{row.sub}</AppText>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textLight} />
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

  rideCheckCard: { backgroundColor: colors.dark, ...cut.sheet, padding: spacing.lg, marginBottom: 12 },
  rideCheckTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveDot: { width: 9, height: 9, borderRadius: 4.5 },

  sosBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: colors.red, borderRadius: 30, paddingVertical: 16, marginBottom: 12,
  },

  card: { backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 10 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  smallBtn: { borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
})
