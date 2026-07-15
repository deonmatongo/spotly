import React, { useState } from 'react'
import {
  View, Text, Pressable, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, {
  FadeIn, FadeInDown, FadeInUp, ZoomIn,
  useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming, withRepeat, Easing,
} from 'react-native-reanimated'
import { colors, spacing, radius, fonts } from '../theme'
import Tappable from '../components/Tappable'
import { useAuth } from '../context/AuthContext'

const SLIDES = [
  {
    icon: 'compass-outline' as const,
    title: 'Discover Everything',
    subtitle: 'Fine dining, fresh groceries, live events, and unique experiences — all in one spot.',
  },
  {
    icon: 'calendar-clear-outline' as const,
    title: 'Book with Ease',
    subtitle: 'Reserve tables, order groceries, and grab event tickets in just a few taps.',
  },
  {
    icon: 'sparkles-outline' as const,
    title: 'Earn Spotly Points',
    subtitle: 'Every booking earns points you can redeem for discounts, free delivery, and VIP perks.',
  },
]

type Props = { onLogin: () => void }
type OtpStep = 'phone' | 'otp'

function FloatingIcon({ icon }: { icon: keyof typeof Ionicons.glyphMap }) {
  const drift = useSharedValue(0)
  React.useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 1900, easing: Easing.inOut(Easing.sin) }),
      ),
      -1, false,
    )
  }, [])
  const floatStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: drift.value * -8 }, { rotate: `${(drift.value - 0.5) * 4}deg` }],
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

function Dot({ active }: { active: boolean }) {
  const width = useSharedValue(active ? 24 : 8)
  React.useEffect(() => {
    width.value = withSpring(active ? 24 : 8, { damping: 14, stiffness: 260 })
  }, [active])
  const style = useAnimatedStyle(() => ({ width: width.value }))
  return <Animated.View style={[styles.dot, style, active && { backgroundColor: colors.primary }]} />
}

export default function OnboardingScreen({ onLogin }: Props) {
  const { requestOtp, verifyOtp } = useAuth()
  const [page, setPage]       = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const [otpStep, setOtpStep] = useState<OtpStep>('phone')
  const [phone, setPhone]     = useState('')
  const [code, setCode]       = useState('')
  const [name, setName]       = useState('')
  const [devOtp, setDevOtp]   = useState<string | undefined>()
  const [error, setError]     = useState('')
  const [busy, setBusy]       = useState(false)
  const shakeX = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }))
  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 }),
    )
  }

  const fullPhone = '+263' + phone.replace(/\D/g, '')

  const handleNext = () => {
    if (page < SLIDES.length - 1) setPage(p => p + 1)
    else setShowLogin(true)
  }

  const handleSend = async () => {
    if (phone.replace(/\D/g, '').length < 9) { setError('Enter a valid Zimbabwe number'); shake(); return }
    setBusy(true); setError('')
    try {
      const { devOtp: hint } = await requestOtp(fullPhone)
      setDevOtp(hint)
      setOtpStep('otp')
    } catch (e: any) { setError(e.message || 'Could not send code'); shake() }
    finally { setBusy(false) }
  }

  const handleVerify = async () => {
    if (code.length < 6) { setError('Enter the 6-digit code'); shake(); return }
    setBusy(true); setError('')
    try {
      await verifyOtp(fullPhone, code, name.trim() || undefined)
      // AuthContext sets user → App re-renders with main content
    } catch (e: any) { setError(e.message || 'Incorrect code'); shake() }
    finally { setBusy(false) }
  }

  if (showLogin) {
    return (
      <LinearGradient colors={['#0D1B2A', '#0D2A1B']} style={styles.fill}>
        <SafeAreaView style={styles.loginSafe} edges={['top', 'bottom']}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.loginScroll} keyboardShouldPersistTaps="handled">

              <Animated.View entering={FadeInDown.duration(450).springify().damping(14)} style={styles.loginLogoWrap}>
                <View style={styles.loginIconBox}>
                  <Ionicons name="location" size={30} color={colors.white} />
                </View>
                <Text style={styles.loginBrand} allowFontScaling={false}>spotly</Text>
                <Text style={styles.loginTagline}>
                  {otpStep === 'phone' ? 'Enter your phone number to get started' : `Code sent to +263 ${phone}`}
                </Text>
              </Animated.View>

              <Animated.View entering={FadeInDown.delay(200).duration(420).springify().damping(14)}>
                <Animated.View style={[styles.loginForm, shakeStyle]}>
                  {otpStep === 'phone' ? (
                    <>
                      <View style={[styles.inputRow, !!error && styles.inputRowError]}>
                        <Text style={styles.dialCode}>+263</Text>
                        <TextInput
                          value={phone}
                          onChangeText={t => { setPhone(t); setError('') }}
                          placeholder="71 234 5678"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          keyboardType="phone-pad"
                          style={styles.textInput}
                        />
                      </View>
                      <View style={styles.inputRow}>
                        <Ionicons name="person-outline" size={18} color="rgba(255,255,255,0.45)" />
                        <TextInput
                          value={name}
                          onChangeText={t => setName(t)}
                          placeholder="Your name (optional)"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          autoCapitalize="words"
                          style={styles.textInput}
                        />
                      </View>
                    </>
                  ) : (
                    <Animated.View entering={FadeInUp.duration(350)}>
                      <View style={[styles.inputRow, !!error && styles.inputRowError]}>
                        <Ionicons name="keypad-outline" size={18} color="rgba(255,255,255,0.45)" />
                        <TextInput
                          value={code}
                          onChangeText={t => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError('') }}
                          placeholder="6-digit code"
                          placeholderTextColor="rgba(255,255,255,0.3)"
                          keyboardType="number-pad"
                          maxLength={6}
                          style={[styles.textInput, { letterSpacing: 6 }]}
                        />
                      </View>
                      {__DEV__ && (
                        <View style={styles.devHint}>
                          <Ionicons name="code-slash-outline" size={12} color="rgba(255,255,255,0.35)" />
                          <Text style={styles.devHintText}>
                            {devOtp ? `Dev OTP: ${devOtp}  ·  or use 000000` : 'Demo: use code 000000'}
                          </Text>
                        </View>
                      )}
                    </Animated.View>
                  )}

                  {!!error && (
                    <View style={styles.errorRow}>
                      <Ionicons name="alert-circle-outline" size={14} color="#FC8181" />
                      <Text style={styles.errorText}>{error}</Text>
                    </View>
                  )}

                  <Tappable style={styles.loginBtn} onPress={otpStep === 'phone' ? handleSend : handleVerify} disabled={busy}>
                    {busy
                      ? <ActivityIndicator color={colors.white} />
                      : <><Text style={styles.loginBtnText}>{otpStep === 'phone' ? 'Send code' : 'Verify'}</Text>
                         <Ionicons name="arrow-forward" size={18} color={colors.white} /></>}
                  </Tappable>

                  {otpStep === 'otp' && (
                    <Tappable onPress={() => { setOtpStep('phone'); setCode(''); setError('') }} style={styles.backBtn}>
                      <Text style={styles.backBtnText}>← Change number</Text>
                    </Tappable>
                  )}
                </Animated.View>
              </Animated.View>

              <Text style={styles.loginFooter}>SPOTLY · HARARE · ZIMBABWE</Text>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    )
  }

  const slide = SLIDES[page]
  return (
    <LinearGradient colors={['#0D1B2A', '#0D2A1B']} style={styles.fill}>
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <Pressable style={styles.skipBtn} onPress={() => setShowLogin(true)} hitSlop={8}>
          <Text style={styles.skipText}>Skip</Text>
        </Pressable>
        <View style={styles.slideWrap}>
          <FloatingIcon icon={slide.icon} />
          <Text style={styles.slideTitle}>{slide.title}</Text>
          <Text style={styles.slideSub}>{slide.subtitle}</Text>
        </View>
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
    </LinearGradient>
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
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 28, elevation: 14,
  },
  slideTitle: { fontFamily: fonts.display, fontSize: 30, color: colors.white, textAlign: 'center', letterSpacing: -0.8, marginBottom: 16 },
  slideSub: { fontFamily: fonts.body, fontSize: 15.5, color: 'rgba(255,255,255,0.65)', textAlign: 'center', lineHeight: 25 },
  bottom: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, gap: 24 },
  dotsRow: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  dot: { height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.25)' },
  nextBtn: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 22, borderTopRightRadius: 8, borderBottomRightRadius: 22, borderBottomLeftRadius: 8,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  nextText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },

  // Login section
  loginSafe: { flex: 1 },
  loginScroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  loginLogoWrap: { alignItems: 'center', paddingTop: spacing.md, marginBottom: spacing.xl },
  loginIconBox: {
    width: 68, height: 68,
    borderTopLeftRadius: 24, borderTopRightRadius: 9, borderBottomRightRadius: 24, borderBottomLeftRadius: 9,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 20, elevation: 10,
  },
  loginBrand: { fontFamily: fonts.display, fontSize: 38, color: colors.white, letterSpacing: -1.5 },
  loginTagline: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6, textAlign: 'center' },
  loginForm: { gap: 12 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 16,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)',
  },
  inputRowError: { borderColor: 'rgba(252,129,129,0.5)' },
  dialCode: { fontFamily: fonts.bodySemi, fontSize: 15, color: 'rgba(255,255,255,0.6)' },
  textInput: { flex: 1, fontFamily: fonts.body, fontSize: 15, color: colors.white, padding: 0 },
  devHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  devHintText: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  errorText: { fontFamily: fonts.body, fontSize: 13, color: '#FC8181' },
  loginBtn: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 22, borderTopRightRadius: 8, borderBottomRightRadius: 22, borderBottomLeftRadius: 8,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 6,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  loginBtnText: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.white },
  backBtn: { alignItems: 'center', paddingVertical: 12 },
  backBtnText: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.4)' },
  loginFooter: {
    textAlign: 'center', fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 3,
    color: 'rgba(255,255,255,0.2)', paddingBottom: spacing.md, marginTop: spacing.xl,
  },
})
