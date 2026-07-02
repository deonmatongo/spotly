import 'react-native-reanimated'
import 'react-native-gesture-handler'
import React, { useEffect, useRef, useState, Component } from 'react'
import { Animated, View, StyleSheet, ScrollView, NativeModules } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useFonts, SpaceGrotesk_700Bold, SpaceGrotesk_600SemiBold, SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk'
import { Manrope_400Regular, Manrope_500Medium, Manrope_600SemiBold, Manrope_700Bold } from '@expo-google-fonts/manrope'

// Close the element inspector if it was left open from a previous session
if (__DEV__ && NativeModules.DevSettings?.isElementInspectorShown) {
  NativeModules.DevSettings.toggleElementInspector()
}
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { StatusBar } from 'expo-status-bar'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { Text } from 'react-native'
import RootNavigator from './src/navigation'
import OnboardingScreen from './src/screens/OnboardingScreen'
import { CartProvider } from './src/context/CartContext'
import { TicketsProvider } from './src/context/TicketsContext'
import { FavoritesProvider } from './src/context/FavoritesContext'
import { BookingsProvider } from './src/context/BookingsContext'
import { NotificationsProvider } from './src/context/NotificationsContext'
import { ReviewsProvider } from './src/context/ReviewsContext'
import { colors, fonts } from './src/theme'
import { ThemeProvider, useTheme } from './src/context/ThemeContext'

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
  const fade = useRef(new Animated.Value(0)).current
  const scale = useRef(new Animated.Value(0.85)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 600, useNativeDriver: false }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: false }),
    ]).start()
    const t = setTimeout(onDone, 2400)
    return () => clearTimeout(t)
  }, [])

  return (
    <LinearGradient colors={['#0D1B2A', '#0D2A1B', '#0D1B2A']} style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.splashCenter, { opacity: fade, transform: [{ scale }] }]}>
        <View style={styles.logoWrap}>
          <View style={styles.logoIcon}>
            <Ionicons name="location" size={38} color={colors.white} />
          </View>
          <View style={styles.logoDot} />
        </View>
        <Text style={styles.logoText} allowFontScaling={false}>spotly</Text>
        <Text style={styles.logoTagline} allowFontScaling={false}>Everything you love, all in one spot.</Text>
        <View style={styles.dots}>
          {[0, 200, 400].map((delay, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: fade }]} />
          ))}
        </View>
      </Animated.View>
      <Text style={styles.splashFooter} allowFontScaling={false}>Discover more. Live better.</Text>
    </LinearGradient>
  )
}

export default function App() {
  const [ready, setReady] = useState(false)
  const [loggedIn, setLoggedIn] = useState(false)

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

  if (!ready) return <ErrorBoundary><SplashScreen onDone={() => setReady(true)} /></ErrorBoundary>

  if (!loggedIn) return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onLogin={() => setLoggedIn(true)} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  )

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <NotificationsProvider>
          <FavoritesProvider>
            <BookingsProvider>
              <ReviewsProvider>
                <TicketsProvider>
                  <CartProvider>
                    <GestureHandlerRootView style={{ flex: 1 }}>
                      <SafeAreaProvider>
                        <ThemedNavRoot />
                      </SafeAreaProvider>
                    </GestureHandlerRootView>
                  </CartProvider>
                </TicketsProvider>
              </ReviewsProvider>
            </BookingsProvider>
          </FavoritesProvider>
        </NotificationsProvider>
      </ThemeProvider>
    </ErrorBoundary>
  )
}

const styles = StyleSheet.create({
  splashCenter: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logoWrap: { position: 'relative', marginBottom: 24 },
  logoIcon: { width: 80, height: 80, backgroundColor: colors.primary, borderRadius: 22, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primary, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.6, shadowRadius: 24, elevation: 12 },
  logoDot: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, backgroundColor: colors.primaryLight },
  logoText: { fontFamily: fonts.display, fontSize: 50, color: colors.white, letterSpacing: -2 },
  logoTagline: { fontFamily: fonts.body, fontSize: 14, color: colors.primaryLight, marginTop: 8, letterSpacing: 0.3 },
  dots: { flexDirection: 'row', gap: 6, marginTop: 32 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primaryLight },
  splashFooter: { position: 'absolute', bottom: 48, alignSelf: 'center', color: '#64748B', fontFamily: fonts.bodyBold, fontSize: 10, letterSpacing: 3, textTransform: 'uppercase' },
})
