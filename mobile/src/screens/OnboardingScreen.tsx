import React, { useState, useRef } from 'react'
import {
  View, Text, Pressable, StyleSheet, Animated,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius } from '../theme'

const SLIDES = [
  {
    icon: 'compass-outline' as const,
    iconBg: 'rgba(21,128,61,0.25)',
    title: 'Discover Everything',
    subtitle: 'Fine dining, fresh groceries, live events, and unique experiences — all in one spot.',
    gradientTop: '#0D1B2A' as const,
    gradientBot: '#0D2A1B' as const,
  },
  {
    icon: 'calendar-clear-outline' as const,
    iconBg: 'rgba(21,128,61,0.25)',
    title: 'Book with Ease',
    subtitle: 'Reserve tables, order groceries, and grab event tickets in just a few taps.',
    gradientTop: '#0D1B2A' as const,
    gradientBot: '#1a1b30' as const,
  },
  {
    icon: 'sparkles-outline' as const,
    iconBg: 'rgba(21,128,61,0.25)',
    title: 'Earn Spotly Points',
    subtitle: 'Every booking earns points you can redeem for discounts, free delivery, and VIP perks.',
    gradientTop: '#0D1B2A' as const,
    gradientBot: '#0D2A1B' as const,
  },
]

type Props = { onLogin: () => void }

export default function OnboardingScreen({ onLogin }: Props) {
  const [page, setPage] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const fadeAnim = useRef(new Animated.Value(1)).current
  const scaleAnim = useRef(new Animated.Value(1)).current
  const iconScale = useRef(new Animated.Value(1)).current

  const transition = (fn: () => void) => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: false }).start(() => {
      fn()
      // Guarantee the next screen is fully laid out & visible, then fade it in.
      scaleAnim.setValue(1)
      iconScale.setValue(1)
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: false }).start()
    })
  }

  const handleNext = () => {
    if (page < SLIDES.length - 1) {
      transition(() => setPage(p => p + 1))
    } else {
      transition(() => setShowLogin(true))
    }
  }

  const handleSkip = () => transition(() => setShowLogin(true))

  const handleLogin = () => {
    if (username.trim() === 'deonmatongo' && password === '123456') {
      onLogin()
    } else {
      setError('Invalid credentials. Please try again.')
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.02, duration: 60, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 0.98, duration: 60, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1.01, duration: 60, useNativeDriver: false }),
        Animated.timing(scaleAnim, { toValue: 1, duration: 60, useNativeDriver: false }),
      ]).start()
    }
  }

  if (showLogin) {
    return (
      <LinearGradient colors={['#0D1B2A', '#0D2A1B']} style={styles.fill}>
        <Animated.View style={[styles.fill, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
          <SafeAreaView style={styles.loginSafe} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              style={styles.fill}
            >
              {/* Logo */}
              <View style={styles.loginLogoWrap}>
                <View style={styles.loginIconBox}>
                  <Ionicons name="location" size={30} color={colors.white} />
                </View>
                <Text style={styles.loginBrand} allowFontScaling={false}>spotly</Text>
                <Text style={styles.loginTagline}>Sign in to continue</Text>
              </View>

              {/* Form */}
              <View style={styles.loginForm}>
                <View style={[styles.inputRow, error ? styles.inputRowError : {}]}>
                  <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.45)" />
                  <TextInput
                    value={username}
                    onChangeText={t => { setUsername(t); setError('') }}
                    placeholder="Username"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    autoCapitalize="none"
                    autoCorrect={false}
                    style={styles.textInput}
                  />
                </View>

                <View style={[styles.inputRow, error ? styles.inputRowError : {}]}>
                  <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.45)" />
                  <TextInput
                    value={password}
                    onChangeText={t => { setPassword(t); setError('') }}
                    placeholder="Password"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    secureTextEntry={!showPass}
                    style={[styles.textInput, { flex: 1 }]}
                  />
                  <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8}>
                    <Ionicons
                      name={showPass ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="rgba(255,255,255,0.45)"
                    />
                  </Pressable>
                </View>

                {!!error && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={14} color="#FC8181" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}

                <Pressable style={styles.loginBtn} onPress={handleLogin}>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </Pressable>

                <Text style={styles.hintText}>Use: deonmatongo / 123456</Text>
              </View>

              <Text style={styles.loginFooter}>DISCOVER MORE. LIVE BETTER.</Text>
            </KeyboardAvoidingView>
          </SafeAreaView>
        </Animated.View>
      </LinearGradient>
    )
  }

  const slide = SLIDES[page]

  return (
    <LinearGradient colors={[slide.gradientTop, slide.gradientBot]} style={styles.fill}>
      <Animated.View style={[styles.fill, { opacity: fadeAnim, transform: [{ scale: scaleAnim }] }]}>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>

          {/* Skip */}
          <Pressable style={styles.skipBtn} onPress={handleSkip}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>

          {/* Slide content */}
          <View style={styles.slideWrap}>
            <Animated.View style={[styles.iconCircle, { backgroundColor: slide.iconBg, transform: [{ scale: iconScale }] }]}>
              <View style={styles.iconInner}>
                <Ionicons name={slide.icon} size={52} color={colors.white} />
              </View>
            </Animated.View>

            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideSub}>{slide.subtitle}</Text>
          </View>

          {/* Bottom controls */}
          <View style={styles.bottom}>
            <View style={styles.dotsRow}>
              {SLIDES.map((_, i) => (
                <Pressable key={i} onPress={() => i !== page && transition(() => setPage(i))}>
                  <Animated.View style={[styles.dot, i === page && styles.dotActive]} />
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.nextBtn} onPress={handleNext}>
              <Text style={styles.nextText}>{page === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
              <Ionicons name="arrow-forward" size={18} color={colors.white} />
            </Pressable>
          </View>

        </SafeAreaView>
      </Animated.View>
    </LinearGradient>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  safe: { flex: 1, justifyContent: 'space-between' },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  skipText: { fontSize: 14, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },

  slideWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70,
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  iconInner: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 14,
  },
  slideTitle: {
    fontSize: 30, fontWeight: '800', color: colors.white,
    textAlign: 'center', letterSpacing: -0.5, marginBottom: 16,
  },
  slideSub: {
    fontSize: 16, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 26, fontWeight: '400',
  },

  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { width: 24, backgroundColor: colors.primary },
  nextBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  nextText: { fontSize: 16, fontWeight: '700', color: colors.white },

  // Login
  loginSafe: { flex: 1, justifyContent: 'space-between', paddingHorizontal: spacing.lg },
  loginLogoWrap: { alignItems: 'center', paddingTop: spacing.xl },
  loginIconBox: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  loginBrand: { fontSize: 38, fontWeight: '800', color: colors.white, letterSpacing: -1.5 },
  loginTagline: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6, fontWeight: '400' },

  loginForm: { flex: 1, justifyContent: 'center', gap: 14 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputRowError: { borderColor: 'rgba(252,129,129,0.5)' },
  textInput: { flex: 1, fontSize: 15, color: colors.white, padding: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontSize: 13, color: '#FC8181', fontWeight: '500' },
  loginBtn: {
    backgroundColor: colors.primary, borderRadius: radius.lg,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 6,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  loginBtnText: { fontSize: 16, fontWeight: '700', color: colors.white },
  hintText: { fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  loginFooter: {
    textAlign: 'center', fontSize: 10, letterSpacing: 3,
    color: 'rgba(255,255,255,0.2)', paddingBottom: spacing.md,
  },
})
