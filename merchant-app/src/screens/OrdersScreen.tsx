import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeIn } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useOrders } from '../context/OrdersContext'
import { MerchantOrder, OrderStatus } from '../data/mock'
import { RootStackParamList } from '../navigation'
import OrderCard from '../components/OrderCard'
import AppText from '../components/AppText'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Filter = 'all' | 'new' | 'preparing' | 'ready' | 'done'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'new', label: 'New' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'done', label: 'Done' },
]

export default function OrdersScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { orders, newOrders, connection } = useOrders()
  const [filter, setFilter] = useState<Filter>('all')
  const live = connection === 'connected'

  const filtered = filter === 'all'
    ? orders.filter(o => o.status !== 'declined')
    : orders.filter(o => o.status === filter)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AppText variant="h1" style={{ color: colors.textPrimary }}>Orders</AppText>
        {newOrders.length > 0 && (
          <View style={[styles.newBadge, { backgroundColor: colors.orange }]}>
            <AppText variant="label" style={{ color: '#fff', fontSize: 10 }}>{newOrders.length} new</AppText>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <View style={styles.liveRow}>
          <View style={[styles.liveDot, { backgroundColor: live ? colors.primary : colors.textLight }]} />
          <AppText variant="label" style={{ fontSize: 9, color: live ? colors.primary : colors.textLight }}>
            {live ? 'Live' : 'Offline'}
          </AppText>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {FILTERS.map(f => {
          const active = filter === f.key
          const count = f.key === 'all' ? orders.filter(o => o.status !== 'declined').length : orders.filter(o => o.status === f.key).length
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryPale : colors.surface }]}
            >
              <AppText variant="bodySemi" style={{ color: active ? colors.primary : colors.textLight, fontSize: 13 }}>{f.label}</AppText>
              {count > 0 && (
                <View style={[styles.filterCount, { backgroundColor: active ? colors.primary : colors.surfaceAlt }]}>
                  <AppText variant="label" style={{ fontSize: 9, color: active ? '#fff' : colors.textMuted, letterSpacing: 0 }}>{count}</AppText>
                </View>
              )}
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeIn.delay(100)} style={[styles.empty, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="receipt-outline" size={30} color={colors.textLight} />
            <AppText variant="h3" style={{ color: colors.textPrimary, marginTop: 12 }}>No orders here</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6 }}>
              {filter === 'new' ? "You're all caught up — new orders will appear here." : 'Nothing in this category right now.'}
            </AppText>
          </Animated.View>
        ) : (
          filtered.map((order, i) => (
            <OrderCard
              key={order.id}
              order={order}
              index={i}
              colors={colors}
              onPress={() => nav.navigate('OrderDetail', { orderId: order.id })}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  newBadge: { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  liveDot: { width: 7, height: 7, borderRadius: 4 },

  filterScroll: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: spacing.md, paddingVertical: 10, gap: 8 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.3, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },
  filterCount: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 },

  content: { padding: spacing.md },
  empty: { alignItems: 'center', padding: spacing.xl, ...cut.cardFlip, borderWidth: 1, borderStyle: 'dashed' },
})
