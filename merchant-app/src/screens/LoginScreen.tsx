import React, { useState } from 'react'
import {
  View, Pressable, StyleSheet, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring, withSequence, withTiming,
} from 'react-native-reanimated'
import { colors, spacing } from '../theme'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

type Props = { onLogin: () => void }

function FieldRow({ icon, value, onChangeText, placeholder, secure, toggleSecure, keyboardType, error }: any) {
  const focus = useSharedValue(0)
  const lineStyle = useAnimatedStyle(() => ({
    backgroundColor: focus.value > 0.5 ? colors.primaryLight : 'rgba(255,255,255,0.14)',
    transform: [{ scaleX: 0.94 + focus.value * 0.06 }],
  }))

  return (
    <View style={styles.field}>
      <View style={styles.fieldRow}>
        <Ionicons name={icon} size={17} color={error ? '#FC8181' : 'rgba(255,255,255,0.45)'} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.28)"
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry={secure}
          keyboardType={keyboardType}
          onFocus={() => { focus.value = withTiming(1, { duration: 180 }) }}
          onBlur={() => { focus.value = withTiming(0, { duration: 180 }) }}
          style={styles.fieldInput}
        />
        {toggleSecure && (
          <Pressable onPress={toggleSecure} hitSlop={8}>
            <Ionicons name={secure ? 'eye-outline' : 'eye-off-outline'} size={17} color="rgba(255,255,255,0.45)" />
          </Pressable>
        )}
      </View>
      <Animated.View style={[styles.fieldLine, lineStyle, error && { backgroundColor: '#FC8181' }]} />
    </View>
  )
}

export default function LoginScreen({ onLogin }: Props) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
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

  const handleLogin = () => {
    if (username.trim() === 'amanzirestaurant' && password === '123456') {
      onLogin()
    } else {
      setError('Invalid credentials — try again.')
      shake()
    }
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
              <AppText variant="body" style={styles.tagline}>Sign in to manage your store</AppText>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(260).duration(450).springify()}>
              <Animated.View style={[styles.form, shakeStyle]}>
                <FieldRow
                  icon="storefront-outline"
                  value={username}
                  onChangeText={(t: string) => { setUsername(t); setError('') }}
                  placeholder="Store username"
                  error={!!error}
                />
                <FieldRow
                  icon="lock-closed-outline"
                  value={password}
                  onChangeText={(t: string) => { setPassword(t); setError('') }}
                  placeholder="Password"
                  secure={!showPass}
                  toggleSecure={() => setShowPass(s => !s)}
                  error={!!error}
                />

                {!!error && (
                  <View style={styles.errorRow}>
                    <Ionicons name="alert-circle-outline" size={13} color="#FC8181" />
                    <AppText variant="caption" style={styles.errorText}>{error}</AppText>
                  </View>
                )}

                <Tappable onPress={handleLogin} style={styles.loginBtn}>
                  <AppText variant="bodyBold" style={styles.loginBtnText}>Sign in</AppText>
                  <Ionicons name="arrow-forward" size={18} color={colors.white} />
                </Tappable>

                <AppText variant="caption" style={styles.hintText}>Use amanzirestaurant · 123456</AppText>
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
  fieldInput: { flex: 1, fontSize: 15.5, fontFamily: 'Manrope_500Medium', color: colors.white, padding: 0 },
  fieldLine: { height: 1.5, borderRadius: 1, marginTop: 2 },

  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10, marginTop: -8 },
  errorText: { color: '#FC8181' },

  loginBtn: {
    backgroundColor: colors.primary,
    borderTopLeftRadius: 20, borderTopRightRadius: 6, borderBottomRightRadius: 20, borderBottomLeftRadius: 6,
    paddingVertical: 17, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 8, marginTop: 14,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 14, elevation: 6,
  },
  loginBtnText: { color: colors.white, fontSize: 16 },
  hintText: { color: 'rgba(255,255,255,0.3)', textAlign: 'center', marginTop: 14 },

  footer: { textAlign: 'center', fontSize: 9.5, letterSpacing: 2.5, color: 'rgba(255,255,255,0.2)', marginTop: spacing.xxl },
})
