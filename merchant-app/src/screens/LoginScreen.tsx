import React, { useState } from 'react'
import {
  View, StyleSheet, ScrollView, TextInput,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeIn, FadeInUp,
  useSharedValue, useAnimatedStyle, withSequence, withTiming,
} from 'react-native-reanimated'
import { colors, spacing } from '../theme'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'
import { useAuth } from '../context/AuthContext'

type Step = 'phone' | 'otp'

function FieldRow({ icon, dialCode, value, onChangeText, placeholder, keyboardType, maxLength, letterSpacing, error }: any) {
  const focus = useSharedValue(0)
  const lineStyle = useAnimatedStyle(() => ({
    backgroundColor: focus.value > 0.5 ? colors.primaryLight : 'rgba(255,255,255,0.14)',
    transform: [{ scaleX: 0.94 + focus.value * 0.06 }],
  }))
  return (
    <View style={styles.field}>
      <View style={styles.fieldRow}>
        {dialCode
          ? <AppText variant="body" style={styles.dialCode}>+263</AppText>
          : <Ionicons name={icon} size={17} color={error ? '#FC8181' : 'rgba(255,255,255,0.45)'} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.28)"
          keyboardType={keyboardType || 'default'}
          maxLength={maxLength}
          autoCapitalize="none"
          autoCorrect={false}
          onFocus={() => { focus.value = withTiming(1, { duration: 180 }) }}
          onBlur={() =>  { focus.value = withTiming(0, { duration: 180 }) }}
          style={[styles.fieldInput, letterSpacing && { letterSpacing }]}
        />
      </View>
      <Animated.View style={[styles.fieldLine, lineStyle, error && { backgroundColor: '#FC8181' }]} />
    </View>
  )
}

export default function LoginScreen() {
  const { requestOtp, verifyOtp } = useAuth()
  const [step, setStep]     = useState<Step>('phone')
  const [phone, setPhone]   = useState('')
  const [code, setCode]     = useState('')
  const [devOtp, setDevOtp] = useState<string | undefined>()
  const [error, setError]   = useState('')
  const [busy, setBusy]     = useState(false)
  const shakeX = useSharedValue(0)
  const shakeStyle = useAnimatedStyle(() => ({ transform: [{ translateX: shakeX.value }] }))
  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-8, { duration: 50 }), withTiming(8, { duration: 50 }),
      withTiming(-6, { duration: 50 }), withTiming(0, { duration: 50 }),
    )
  }

  const fullPhone = '+263' + phone.replace(/\D/g, '')

  const handleSend = async () => {
    if (phone.replace(/\D/g, '').length < 9) { setError('Enter a valid Zimbabwe number'); shake(); return }
    setBusy(true); setError('')
    try {
      const { devOtp: hint } = await requestOtp(fullPhone)
      setDevOtp(hint)
      setStep('otp')
    } catch (e: any) { setError(e.message || 'Could not send code'); shake() }
    finally { setBusy(false) }
  }

  const handleVerify = async () => {
    if (code.length < 6) { setError('Enter the 6-digit code'); shake(); return }
    setBusy(true); setError('')
    try {
      await verifyOtp(fullPhone, code)
    } catch (e: any) { setError(e.message || 'Incorrect code'); shake() }
    finally { setBusy(false) }
  }

  return (
    <View style={styles.fill}>
      <View style={styles.wedgeTop} />
      <View style={styles.wedgeTopAccent} />
      <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.fill}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">

            <Animated.View entering={FadeInDown.duration(500).springify()} style={styles.brandBlock}>
              <View style={styles.iconBox}>
                <Ionicons name="storefront" size={26} color={colors.white} />
              </View>
              <AppText variant="display" style={styles.brand}>spotly{'\n'}merchant</AppText>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(200).duration(400)}>
              <AppText variant="body" style={styles.tagline}>
                {step === 'phone' ? 'Enter your phone number to sign in' : `Code sent to +263 ${phone}`}
              </AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(450).springify()}>
              <Animated.View style={[styles.form, shakeStyle]}>
                {step === 'phone' ? (
                  <FieldRow
                    dialCode
                    value={phone}
                    onChangeText={(t: string) => { setPhone(t); setError('') }}
                    placeholder="71 234 5678"
                    keyboardType="phone-pad"
                    error={!!error}
                  />
                ) : (
                  <Animated.View entering={FadeInUp.duration(350)}>
                    <FieldRow
                      icon="keypad-outline"
                      value={code}
                      onChangeText={(t: string) => { setCode(t.replace(/\D/g, '').slice(0, 6)); setError('') }}
                      placeholder="6-digit code"
                      keyboardType="number-pad"
                      maxLength={6}
                      letterSpacing={6}
                      error={!!error}
                    />
                    {devOtp && (
                      <View style={styles.devHint}>
                        <Ionicons name="code-slash-outline" size={12} color="rgba(255,255,255,0.35)" />
                        <AppText variant="caption" style={styles.devHintText}>Dev OTP: {devOtp}</AppText>
                      </View>
                    )}
                  </Animated.View>
                )}

                {!!error && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#FC8181" />
                    <AppText variant="caption" style={styles.errorText}>{error}</AppText>
                  </View>
                )}

                <Tappable onPress={step === 'phone' ? handleSend : handleVerify} style={styles.btn} disabled={busy}>
                  {busy
                    ? <ActivityIndicator color={colors.white} />
                    : <><AppText variant="bodyBold" style={styles.btnText}>{step === 'phone' ? 'Send code' : 'Verify'}</AppText>
                       <Ionicons name="arrow-forward" size={18} color={colors.white} /></>}
                </Tappable>

                {step === 'otp' && (
                  <Tappable onPress={() => { setStep('phone'); setCode(''); setError('') }} style={styles.backBtn}>
                    <AppText variant="caption" style={styles.backBtnText}>← Change number</AppText>
                  </Tappable>
                )}
              </Animated.View>
            </Animated.View>

            <Animated.View entering={FadeIn.delay(500).duration(500)}>
              <AppText variant="label" style={styles.footer}>Your store · your way</AppText>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: '#0B1622' },
  safe: { flex: 1 },
  wedgeTop: {
    position: 'absolute', top: -140, right: -120, width: 340, height: 340, borderRadius: 90,
    backgroundColor: 'rgba(34,197,94,0.14)', transform: [{ rotate: '18deg' }],
  },
  wedgeTopAccent: {
    position: 'absolute', top: -40, right: 40, width: 120, height: 120, borderRadius: 34,
    backgroundColor: 'rgba(74,222,128,0.10)', transform: [{ rotate: '-12deg' }],
  },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: spacing.lg },
  brandBlock: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md },
  iconBox: {
    width: 52, height: 52, backgroundColor: colors.primary, marginRight: 14,
    borderTopLeftRadius: 18, borderTopRightRadius: 6, borderBottomRightRadius: 18, borderBottomLeftRadius: 6,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 18, elevation: 8,
  },
  brand: { color: colors.white, fontSize: 30, lineHeight: 30 },
  tagline: { color: 'rgba(255,255,255,0.5)', marginBottom: spacing.xl, marginTop: 4 },
  form: { gap: 4 },
  field: { marginBottom: 22 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingBottom: 10 },
  dialCode: { color: 'rgba(255,255,255,0.6)', fontSize: 15.5 },
  fieldInput: { flex: 1, fontSize: 15.5, fontFamily: 'Manrope_500Medium', color: colors.white, padding: 0 },
  fieldLine: { height: 1.5, borderRadius: 1, marginTop: 2 },
  devHint: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -10, marginBottom: 10 },
  devHintText: { color: 'rgba(255,255,255,0.35)' },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: -8 },
  errorText: { color: '#FC8181' },
  btn: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20, borderTopRightRadius: 6, borderBottomRightRadius: 20, borderBottomLeftRadius: 6,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  btnText: { color: colors.white, fontSize: 16 },
  backBtn: { alignItems: 'center', paddingVertical: 12 },
  backBtnText: { color: 'rgba(255,255,255,0.4)' },
  footer: { textAlign: 'center', fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.2)', marginTop: spacing.xxl },
})
