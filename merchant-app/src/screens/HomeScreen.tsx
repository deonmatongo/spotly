import React from 'react'
import { View, ScrollView, StyleSheet, Switch, Pressable } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import Animated, { FadeIn, FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useStore } from '../context/StoreContext'
import { useOrders } from '../context/OrdersContext'
import { weeklyRevenue, revenueSummary } from '../data/mock'
import { RootStackParamList } from '../navigation'
import OrderCard from '../components/OrderCard'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'
import useCountUp from '../hooks/useCountUp'

type Nav = NativeStackNavigationProp<RootStackParamList>

function GrowBar({ pct, index, color, trackColor }: { pct: number; index: number; color: string; trackColor: string }) {
  const grow = useSharedValue(0)
  React.useEffect(() => {
    grow.value = withDelay(index * 55, withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }))
  }, [])
  const style = useAnimatedStyle(() => ({ height: `${grow.value * pct * 100}%` }))
  return (
    <View style={{ width: 14, height: '86%', justifyContent: 'flex-end', borderRadius: 7, overflow: 'hidden', backgroundColor: trackColor }}>
      <Animated.View style={[{ width: '100%', borderRadius: 7, minHeight: 4, backgroundColor: color }, style]} />
    </View>
  )
}

export default function HomeScreen() {
  const { colors } = useTheme()
  const insets = useSafeAreaInsets()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { store, isOpen, toggleOpen } = useStore()
  const { orders, newOrders, preparingOrders } = useOrders()
  const maxAmount = Math.max(...weeklyRevenue.map(d => d.amount))
  const todayRevenue = useCountUp(revenueSummary.today.amount, 800)

  const recentOrders = orders.filter(o => o.status !== 'declined').slice(0, 3)

  return (
    <View style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        <Animated.View entering={FadeIn.duration(400)}>
          <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.hero, { paddingTop: insets.top + spacing.md }]}>
            <View style={styles.heroSlash} />
            <View style={styles.heroSlashSmall} />

            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <AppText variant="label" style={{ color: 'rgba(255,255,255,0.75)' }}>Welcome back</AppText>
                <AppText variant="h1" style={{ color: '#fff', marginTop: 2 }}>{store.name}</AppText>
              </View>
              <View style={styles.openBlock}>
                <Switch
                  value={isOpen}
                  onValueChange={toggleOpen}
                  trackColor={{ false: 'rgba(255,255,255,0.22)', true: 'rgba(255,255,255,0.5)' }}
                  thumbColor={isOpen ? '#fff' : 'rgba(255,255,255,0.6)'}
                />
                <AppText variant="label" style={{ color: isOpen ? '#fff' : 'rgba(255,255,255,0.6)', marginTop: 6, fontSize: 9.5 }}>
                  {isOpen ? 'Open' : 'Closed'}
                </AppText>
              </View>
            </View>

            <View style={styles.statRow}>
              <View style={styles.statTicket}>
                <AppText variant="num" style={{ color: '#fff', fontSize: 26 }}>${todayRevenue.toFixed(2)}</AppText>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Today</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statTicket}>
                <AppText variant="num" style={{ color: '#fff', fontSize: 26 }}>{revenueSummary.today.orders}</AppText>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Orders</AppText>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statTicket}>
                <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 3 }}>
                  <AppText variant="num" style={{ color: '#fff', fontSize: 26 }}>{store.rating}</AppText>
                  <Ionicons name="star" size={13} color="#FCD34D" />
                </View>
                <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)' }}>Rating</AppText>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <View style={styles.content}>
          {newOrders.length > 0 && (
            <Animated.View entering={FadeInDown.springify().damping(16)}>
              <Tappable onPress={() => nav.navigate('MainTabs' as any)} style={[styles.alertBanner, { backgroundColor: colors.orange + '22', borderColor: colors.orange }]}>
                <View style={[styles.alertIcon, { backgroundColor: colors.orange }]}>
                  <Ionicons name="flash" size={16} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" style={{ color: colors.orange }}>{newOrders.length} new {newOrders.length === 1 ? 'order' : 'orders'} waiting</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>Tap to review and accept</AppText>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.orange} />
              </Tappable>
            </Animated.View>
          )}

          {preparingOrders.length > 0 && (
            <Animated.View entering={FadeInDown.delay(60).springify().damping(16)}>
              <View style={[styles.prepBanner, { backgroundColor: colors.amberPale, borderColor: colors.amber }]}>
                <Ionicons name="flame" size={14} color={colors.amber} />
                <AppText variant="bodySemi" style={{ color: colors.amber, fontSize: 13 }}>
                  {preparingOrders.length} {preparingOrders.length === 1 ? 'order' : 'orders'} in the kitchen
                </AppText>
              </View>
            </Animated.View>
          )}

          {/* Quick actions */}
          <Animated.View entering={FadeInDown.delay(80).springify().damping(16)} style={styles.quickRow}>
            <Tappable onPress={() => nav.navigate('AddItem')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.quickIcon, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name="add-circle" size={20} color={colors.primary} />
              </View>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>Add item</AppText>
            </Tappable>
            <Tappable onPress={() => nav.navigate('Notifications')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.quickIcon, { backgroundColor: colors.bluePale }]}>
                <Ionicons name="notifications" size={20} color={colors.blue} />
              </View>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>Alerts</AppText>
            </Tappable>
            <Tappable onPress={() => nav.navigate('Payouts')} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.quickIcon, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name="wallet" size={20} color={colors.primary} />
              </View>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>Payouts</AppText>
            </Tappable>
            <Tappable onPress={() => {}} style={[styles.quickCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.quickIcon, { backgroundColor: colors.amberPale }]}>
                <Ionicons name="megaphone" size={20} color={colors.amber} />
              </View>
              <AppText variant="caption" style={{ color: colors.textSecondary, marginTop: 6, textAlign: 'center' }}>Promote</AppText>
            </Tappable>
          </Animated.View>

          {/* Weekly chart */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
            <AppText variant="h2" style={{ color: colors.textPrimary }}>This week</AppText>
          </View>
          <Animated.View entering={FadeInDown.delay(100).springify().damping(16)} style={[styles.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.chartRow}>
              {weeklyRevenue.map((day, i) => (
                <View key={day.label} style={styles.chartCol}>
                  <GrowBar pct={day.amount / maxAmount} index={i} color={day.amount === maxAmount ? colors.primary : colors.primary + '88'} trackColor={colors.surfaceAlt} />
                  <AppText variant="label" style={{ fontSize: 9.5, marginTop: 8, color: colors.textMuted }}>{day.label}</AppText>
                </View>
              ))}
            </View>
          </Animated.View>

          {/* Recent orders */}
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
            <AppText variant="h2" style={{ color: colors.textPrimary, flex: 1 }}>Recent orders</AppText>
            <Pressable onPress={() => nav.navigate('MainTabs' as any)}>
              <AppText variant="caption" style={{ color: colors.primary }}>See all</AppText>
            </Pressable>
          </View>

          {recentOrders.map((order, i) => (
            <OrderCard
              key={order.id}
              order={order}
              index={i}
              colors={colors}
              onPress={() => nav.navigate('OrderDetail', { orderId: order.id })}
            />
          ))}

          <View style={{ height: 100 }} />
        </View>
      </ScrollView>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: { padding: spacing.md },

  hero: {
    borderBottomRightRadius: 32, borderBottomLeftRadius: 8,
    paddingHorizontal: spacing.lg, paddingBottom: spacing.lg, overflow: 'hidden',
  },
  heroSlash: { position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '22deg' }] },
  heroSlashSmall: { position: 'absolute', bottom: -30, left: -20, width: 90, height: 90, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ rotate: '-10deg' }] },
  heroTop: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg },
  openBlock: { alignItems: 'center' },

  statRow: { flexDirection: 'row', alignItems: 'center' },
  statTicket: { flex: 1, alignItems: 'center' },
  statDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.22)' },

  alertBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderWidth: 1.5, ...cut.chip, padding: 14, marginBottom: 10,
  },
  alertIcon: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  prepBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, ...cut.chip, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 10,
  },

  quickRow: { flexDirection: 'row', gap: 10, marginBottom: spacing.md },
  quickCard: { flex: 1, borderWidth: 1, ...cut.card, padding: 12, alignItems: 'center' },
  quickIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },

  chartCard: { borderWidth: 1, ...cut.card, padding: spacing.md, marginBottom: spacing.md },
  chartRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', height: 110 },
  chartCol: { alignItems: 'center', flex: 1, height: '100%', justifyContent: 'flex-end' },
})
