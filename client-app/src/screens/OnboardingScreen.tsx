import React, { useState } from 'react'
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  FadeIn, FadeInDown, FadeInRight, FadeOutLeft, ZoomIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat, withDelay, Easing,
} from 'react-native-reanimated'
import { colors, spacing, radius, fonts } from '../theme'
import Tappable from '../components/Tappable'

const SLIDES = [
  {
    icon: 'compass-outline' as const,
    title: 'Discover Everything',
    subtitle: 'Fine dining, fresh groceries, live events, and unique experiences — all in one spot.',
    gradientTop: '#0D1B2A' as const,
    gradientBot: '#0D2A1B' as const,
  },
  {
    icon: 'calendar-clear-outline' as const,
    title: 'Book with Ease',
    subtitle: 'Reserve tables, order groceries, and grab event tickets in just a few taps.',
    gradientTop: '#0D1B2A' as const,
    gradientBot: '#1a1b30' as const,
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Earn Spotly Points',
    subtitle: 'Every booking earns points you can redeem for discounts, free delivery, and VIP perks.',
    gradientTop: '#0D1B2A' as const,
    gradientBot: '#0D2A1B' as const,
  },
]

type Props = { onLogin: () => void }

// The hero icon drifts and tilts on a slow loop — the screen never reads as a
// frozen poster even when the user pauses on a slide.
function FloatingIcon({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const drift = useSharedValue(0)

  React.useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1,
      false,
    )
  }, [])

  const floatStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: drift.value * -8 },
      { rotate: `${(drift.value - 0.5) * 4}deg` },
    ],
  }))

  return (
    <Animated.View entering={ZoomIn.delay(120).springify().damping(11)} style={floatStyle}>
      <View style={styles.iconCircle}>
        <View style={styles.iconInner}>
          <Ionicons name={icon} size={52} color={colors.white} />
        </View>
      </View>
    </Animated.View>
  )
}

// Pagination dot that stretches into a pill as it becomes active.
function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 24 : 8)

  React.useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 14, stiffness: 260 })
  }, [active])

  const style = useAnimatedStyle(() => ({ width: width.value }))

  return (
    <Animated.View
      style={[styles.dot, style, active && { backgroundColor: colors.primary }]}
    />
  )
}

export default function OnboardingScreen({ onLogin }: Props) {
  const [page, setPage] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')
  const shakeX = useSharedValue(0)

  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }))

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 }),
    )
  }

  const handleNext = () => {
    if (page < SLIDES.length - 1) setPage(p => p + 1)
    else setShowLogin(true)
  }

  const handleSkip = () => setShowLogin(true)

  const handleLogin = () => {
    if (username.trim() === 'deonmatongo' && password === '123456') {
      onLogin()
    } else {
      setError('Invalid credentials. Please try again.')
      shake()
    }
  }

  const handleSignup = () => {
    const emailOk = /\S+@\S+\.\S+/.test(email.trim())
    const phoneOk = phone.replace(/\D/g, '').length >= 9
    if (name.trim() && emailOk && phoneOk) {
      onLogin()
    } else {
      setError(!name.trim() ? 'Please enter your name.' : !emailOk ? 'Enter a valid email address.' : 'Enter a valid phone number.')
      shake()
    }
  }

  // Demo: Apple / Google sign-in just continues into the app
  const handleSocial = (_provider: 'apple' | 'google') => onLogin()

  const switchMode = (m: 'signin' | 'signup') => { setAuthMode(m); setError('') }

  if (showLogin) {
    const isSignup = authMode === 'signup'
    return (
      <LinearGradient colors={['#0D1B2A', '#0D2A1B']} style={styles.fill}>
        <SafeAreaView style={styles.loginSafe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">
              {/* Logo */}
              <Animated.View entering={FadeInDown.duration(450).springify().damping(14)} style={styles.loginLogoWrap}>
                <View style={styles.loginIconBox}>
                  <Ionicons name="location" size={30} color={colors.white} />
                </View>
                <Text style={styles.loginBrand} allowFontScaling={false}>spotly</Text>
                <Text style={styles.loginTagline}>{isSignup ? 'Create your account' : 'Sign in to continue'}</Text>
              </Animated.View>

              {/* Social login */}
              <Animated.View entering={FadeInDown.delay(120).duration(400).springify().damping(14)}>
                <Tappable style={[styles.socialBtn, styles.appleBtn]} onPress={() => handleSocial('apple')}>
                  <Ionicons name="logo-apple" size={19} color="#fff" />
                  <Text style={styles.socialTextLight}>Continue with Apple</Text>
                </Tappable>
                <Tappable style={[styles.socialBtn, styles.googleBtn]} onPress={() => handleSocial('google')}>
                  <Ionicons name="logo-google" size={18} color="#EA4335" />
                  <Text style={styles.socialTextDark}>Continue with Google</Text>
                </Tappable>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(220).duration(400)} style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or {isSignup ? 'sign up' : 'sign in'} with email</Text>
                <View style={styles.dividerLine} />
              </Animated.View>

              {/* Form */}
              <Animated.View entering={FadeInDown.delay(280).duration(420).springify().damping(14)}>
                <Animated.View style={[styles.loginForm, shakeStyle]}>
                  {isSignup && (
                    <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                      <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.45)" />
                      <TextInput value={name} onChangeText={t => { setName(t); setError('') }} placeholder="Full name" placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="words" style={styles.textInput} />
                    </View>
                  )}

                  {isSignup ? (
                    <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                      <Ionicons name="mail-outline" size={18} color="rgba(255,255,255,0.45)" />
                      <TextInput value={email} onChangeText={t => { setEmail(t); setError('') }} placeholder="Email address" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} style={styles.textInput} />
                    </View>
                  ) : (
                    <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                      <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.45)" />
                      <TextInput value={username} onChangeText={t => { setUsername(t); setError('') }} placeholder="Username" placeholderTextColor="rgba(255,255,255,0.3)" autoCapitalize="none" autoCorrect={false} style={styles.textInput} />
                    </View>
                  )}

                  {isSignup && (
                    <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                      <Ionicons name="call-outline" size={18} color="rgba(255,255,255,0.45)" />
                      <TextInput value={phone} onChangeText={t => { setPhone(t); setError('') }} placeholder="Phone number" placeholderTextColor="rgba(255,255,255,0.3)" keyboardType="phone-pad" style={styles.textInput} />
                    </View>
                  )}

                  <View style={[styles.inputRow, error ? styles.inputRowError : null]}>
                    <Ionicons name="lock-closed-outline" size={18} color="rgba(255,255,255,0.45)" />
                    <TextInput value={password} onChangeText={t => { setPassword(t); setError('') }} placeholder="Password" placeholderTextColor="rgba(255,255,255,0.3)" secureTextEntry={!showPass} style={[styles.textInput, { flex: 1 }]} />
                    <Pressable onPress={() => setShowPass(s => !s)} hitSlop={8}>
                      <Ionicons name={showPass ? 'eye-off-outline' : 'eye-outline'} size={18} color="rgba(255,255,255,0.45)" />
                    </Pressable>
                  </View>

                  {!!error && (
                    <Animated.View entering={FadeIn.duration(200)} style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#FC8181" />
                      <Text style={styles.errorText}>{error}</Text>
                    </Animated.View>
                  )}

                  <Tappable style={styles.loginBtn} onPress={isSignup ? handleSignup : handleLogin}>
                    <Text style={styles.loginBtnText}>{isSignup ? 'Create account' : 'Sign In'}</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </Tappable>

                  {!isSignup && <Text style={styles.hintText}>Use: deonmatongo / 123456</Text>}

                  <Pressable onPress={() => switchMode(isSignup ? 'signin' : 'signup')} style={styles.toggleRow}>
                    <Text style={styles.toggleText}>
                      {isSignup ? 'Already have an account? ' : "Don't have an account? "}
                      <Text style={styles.toggleLink}>{isSignup ? 'Sign in' : 'Sign up'}</Text>
                    </Text>
                  </Pressable>
                </Animated.View>
              </Animated.View>

              <Animated.View entering={FadeIn.delay(500).duration(500)}>
                <Text style={styles.loginFooter}>DISCOVER MORE. LIVE BETTER.</Text>
              </Animated.View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  const slide = SLIDES[page]

  return (
    <View style={[styles.fill, { backgroundColor: '#0D1B2A' }]}>
      {/* Gradient crossfades between slides */}
      <Animated.View key={`bg-${page}`} entering={FadeIn.duration(450)} style={StyleSheet.absoluteFill}>
        <LinearGradient colors={[slide.gradientTop, slide.gradientBot]} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        {/* Skip */}
        <Pressable style={styles.skipBtn} onPress={handleSkip}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>

        {/* Slide content — slides in from the right, exits left */}
        <Animated.View
          key={`slide-${page}`}
          entering={FadeInRight.duration(380).springify().damping(17)}
          exiting={FadeOutLeft.duration(200)}
          style={styles.slideWrap}
        >
          <FloatingIcon icon={slide.icon} />
          <Animated.View entering={FadeInDown.delay(180).duration(400)}>
            <Text style={styles.slideTitle}>{slide.title}</Text>
          </Animated.View>
          <Animated.View entering={FadeInDown.delay(280).duration(400)}>
            <Text style={styles.slideSub}>{slide.subtitle}</Text>
          </Animated.View>
        </Animated.View>

        {/* Bottom controls */}
        <View style={styles.bottom}>
          <View style={styles.dotsRow}>
            {SLIDES.map((_, i) => (
              <Pressable key={i} onPress={() => i !== page && setPage(i)} hitSlop={6}>
                <Dot active={i === page} />
              </Pressable>
            ))}
          </View>

          <Tappable style={styles.nextBtn} onPress={handleNext}>
            <Text style={styles.nextText}>{page === SLIDES.length - 1 ? 'Get Started' : 'Next'}</Text>
            <Ionicons name="arrow-forward" size={18} color={colors.white} />
          </Tappable>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1 },

  safe: { flex: 1, justifyContent: 'space-between' },
  skipBtn: { alignSelf: 'flex-end', paddingHorizontal: spacing.lg, paddingTop: spacing.md },
  skipText: { fontFamily: fonts.bodySemi, fontSize: 14, color: 'rgba(255,255,255,0.5)' },

  slideWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  iconCircle: {
    width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(21,128,61,0.25)',
    alignItems: 'center', justifyContent: 'center', marginBottom: 36,
  },
  iconInner: {
    width: 110, height: 110,
    borderTopLeftRadius: 40, borderTopRightRadius: 14, borderBottomRightRadius: 40, borderBottomLeftRadius: 14,
    backgroundColor: colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 28,
    elevation: 14,
  },
  slideTitle: {
    fontFamily: fonts.display, fontSize: 30, color: colors.white,
    textAlign: 'center', letterSpacing: -0.8, marginBottom: 16,
  },
  slideSub: {
    fontFamily: fonts.body, fontSize: 15.5, color: 'rgba(255,255,255,0.65)',
    textAlign: 'center', lineHeight: 25,
  },

  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  nextBtn: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 22, borderTopRightRadius: 8, borderBottomRightRadius: 22, borderBottomLeftRadius: 8,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  nextText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },

  // Login
  loginSafe: { flex: 1 },
  loginScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  loginLogoWrap: { alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.lg },
  loginIconBox: {
    width: 68, height: 68,
    borderTopLeftRadius: 24, borderTopRightRadius: 9, borderBottomRightRadius: 24, borderBottomLeftRadius: 9,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  loginBrand: { fontFamily: fonts.display, fontSize: 38, color: colors.white, letterSpacing: -1.5 },
  loginTagline: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 },

  loginForm: { gap: 14 },

  // Social login
  socialBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, borderRadius: radius.lg, paddingVertical: 14, marginBottom: 10 },
  appleBtn: { backgroundColor: '#000', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.18)' },
  googleBtn: { backgroundColor: '#fff' },
  socialTextLight: { fontFamily: fonts.bodySemi, fontSize: 15, color: '#fff' },
  socialTextDark: { fontFamily: fonts.bodySemi, fontSize: 15, color: '#1F2937' },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  dividerText: { fontFamily: fonts.bodyReg, fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  toggleRow: { alignItems: 'center', marginTop: 14 },
  toggleText: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.6)' },
  toggleLink: { fontFamily: fonts.bodyBold, color: colors.primaryLight },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputRowError: { borderColor: 'rgba(252,129,129,0.5)' },
  textInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.white, padding: 0 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: '#FC8181' },
  loginBtn: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 22, borderTopRightRadius: 8, borderBottomRightRadius: 22, borderBottomLeftRadius: 8,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 6,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  loginBtnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },
  hintText: { fontFamily: fonts.bodyReg, fontSize: 12, color: 'rgba(255,255,255,0.3)', textAlign: 'center' },

  loginFooter: {
    textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 3,
    color: 'rgba(255,255,255,0.2)', paddingBottom: spacing.md, marginTop: spacing.md,
  },
})
