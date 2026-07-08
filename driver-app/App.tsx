import 'react-native-reanimated'
import 'react-native-gesture-handler'
import './src/services/locationTask'
import React, { useEffect, useRef, useState, Component } from 'react'
import { View, StyleSheet, ScrollView, Text } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, Easing } from 'react-native-reanimated'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk'
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope'
import RootNavigator from './src/navigation'
import LoginScreen from './src/screens/LoginScreen'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'
import { AuthProvider, useAuth } from './src/context/AuthContext'
import { DriverProvider } from './src/context/DriverContext'
import { JobsProvider } from './src/context/JobsContext'
import { NotificationsProvider } from './src/context/NotificationsContext'
import { colors } from './src/theme'
import AppText from './src/components/AppText'

function ThemedNavRoot() {
  const { colors, isDark } = useTheme()
  const navTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: colors.background,
      card: colors.surface,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.primary,
    },
  }
  return (
    <NavigationContainer theme={navTheme}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator />
    </NavigationContainer>
  )
}

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null }
  static getDerivedStateFromError(error: Error) { return { error } }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: '#0D1B2A', justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ color: '#22C55E', fontSize: 18, fontWeight: '700', marginBottom: 12 }}>Something went wrong</Text>
          <ScrollView style={{ maxHeight: 400 }}>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12, fontFamily: 'monospace' }}>
              {(this.state.error as Error).message}
            </Text>
          </ScrollView>
        </View>
      )
    }
    return this.props.children
  }
}

function SplashScreen({ onDone }: { onDone: () => void }) {
  const badge = useSharedValue(0)
  const sweep = useSharedValue(0)
  const wordmark = useSharedValue(0)

  useEffect(() => {
    badge.value = withSpring(1, { damping: 9, stiffness: 140 })
    sweep.value = withDelay(200, withTiming(1, { duration: 900, easing: Easing.out(Easing.cubic) }))
    wordmark.value = withDelay(260, withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) }))
    const t = setTimeout(onDone, 1900)
    return () => clearTimeout(t)
  }, [])

  const badgeStyle = useAnimatedStyle(() => ({
    transform: [{ scale: badge.value }, { rotate: `${(1 - badge.value) * -35}deg` }],
  }))
  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: (1 - sweep.value) * -80 }],
    opacity: sweep.value,
  }))
  const wordStyle = useAnimatedStyle(() => ({
    opacity: wordmark.value,
    transform: [{ translateY: (1 - wordmark.value) * 10 }],
  }))

  return (
    <View style={styles.splashFill}>
      <View style={styles.splashCenter}>
        <Animated.View style={[styles.logoIcon, badgeStyle]}>
          <Ionicons name="car-sport" size={34} color={colors.white} />
        </Animated.View>

        <Animated.View style={[styles.sweepRow, sweepStyle]}>
          <View style={[styles.sweepDash, { backgroundColor: colors.primary }]} />
          <View style={[styles.sweepDash, styles.sweepDashShort, { backgroundColor: colors.primaryLight }]} />
        </Animated.View>

        <Animated.View style={wordStyle}>
          <AppText variant="display" style={styles.logoText} allowFontScaling={false}>spotly driver</AppText>
        </Animated.View>
        <AppText variant="label" style={styles.logoTagline} allowFontScaling={false}>Move the city · earn your way</AppText>
      </View>
    </View>
  )
}

function AppGate() {
  const { user, isLoading } = useAuth()
  const [ready, setReady] = useState(false)

  if (!ready) return <SplashScreen onDone={() => setReady(true)} />
  if (isLoading) return <View style={{ flex: 1, backgroundColor: '#0B1622' }} />
  if (!user) return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <LoginScreen />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )

  return (
    <NotificationsProvider>
      <DriverProvider>
        <JobsProvider>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
              <ThemedNavRoot />
            </SafeAreaProvider>
          </GestureHandlerRootView>
        </JobsProvider>
      </DriverProvider>
    </NotificationsProvider>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    SpaceGrotesk_700Bold,
    SpaceGrotesk_600SemiBold,
    SpaceGrotesk_500Medium,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
  })

  if (!fontsLoaded) return null

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <AppGate />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  splashFill: { flex: 1, backgroundColor: '#0B1622', alignItems: 'center', justifyContent: 'center' },
  splashCenter: { alignItems: 'center' },
  logoIcon: {
    width: 76, height: 76, backgroundColor: colors.primary,
    borderTopLeftRadius: 26, borderTopRightRadius: 10, borderBottomRightRadius: 26, borderBottomLeftRadius: 10,
    alignItems: 'center', justifyContent: 'center', marginBottom: 22,
    shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 26, elevation: 12,
  },
  sweepRow: { flexDirection: 'row', gap: 6, marginBottom: 16 },
  sweepDash: { width: 26, height: 4, borderRadius: 2 },
  sweepDashShort: { width: 12 },
  logoText: { color: colors.white, fontSize: 30, letterSpacing: -1 },
  logoTagline: { color: colors.primaryLight, marginTop: 10, fontSize: 10.5 },
})
