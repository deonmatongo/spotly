import React, { useEffect, useState, useCallback } from 'react'
import { View, Text, ScrollView, StyleSheet, Pressable, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { colors as staticColors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { getApiUrl } from '@spotly/shared'
import { RootStackParamList } from '../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList>

const ACTIVE_STATUSES = new Set(['placed', 'preparing', 'ready', 'picked_up', 'en_route'])

const STATUS_LABEL: Record<string, string> = {
  placed:    'Order placed',
  preparing: 'Preparing',
  ready:     'Ready for pickup',
  picked_up: 'Picked up',
  en_route:  'On the way',
  delivered: 'Delivered',
  declined:  'Declined',
}

const STATUS_COLOR: Record<string, string> = {
  placed:    '#3B82F6',
  preparing: '#F59E0B',
  ready:     '#8B5CF6',
  picked_up: '#06B6D4',
  en_route:  '#10B981',
  delivered: '#6B7280',
  declined:  '#EF4444',
}

interface ApiOrder {
  ref: string
  merchantName: string
  status: string
  items: { name: string; qty: number; price: number }[]
  total: number
  placedAt: number
  address: string
}

export default function OrderHistoryScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { accessToken } = useAuth()

  const [orders, setOrders] = useState<ApiOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${getApiUrl()}/api/orders/mine`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (!res.ok) throw new Error('Server error')
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setError('Could not load orders. Check your connection.')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [accessToken])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const onRefresh = () => { setRefreshing(true); fetchOrders(true) }

  const active = orders.filter(o => ACTIVE_STATUSES.has(o.status))
  const past   = orders.filter(o => !ACTIVE_STATUSES.has(o.status))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={[styles.topTitle, { color: colors.textPrimary }]}>Order History</Text>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} size="large" />
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Ionicons name="wifi-outline" size={48} color={colors.textLight} />
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Connection error</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>{error}</Text>
          <Pressable onPress={() => fetchOrders()} style={[styles.retryBtn, { borderColor: colors.primary }]}>
            <Text style={{ color: colors.primary, fontWeight: '600', fontSize: 14 }}>Retry</Text>
          </Pressable>
        </View>
      ) : orders.length === 0 ? (
        <View style={styles.centered}>
          <View style={styles.emptyIcon}><Ionicons name="receipt-outline" size={44} color={colors.textLight} /></View>
          <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>No orders yet</Text>
          <Text style={[styles.emptySub, { color: colors.textMuted }]}>Your order history will appear here</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
          {active.length > 0 && (
            <>
              <SectionHeader label="Active orders" count={active.length} colors={colors} />
              {active.map((order, i) => (
                <OrderCard
                  key={order.ref}
                  order={order}
                  index={i}
                  colors={colors}
                  styles={styles}
                  onTrack={() => nav.navigate('OrderTracking', {
                    orderNumber: order.ref,
                    total: order.total,
                    items: order.items?.length ?? 0,
                  })}
                />
              ))}
            </>
          )}

          {past.length > 0 && (
            <>
              {active.length > 0 && <View style={{ height: 8 }} />}
              <SectionHeader label="Past orders" count={past.length} colors={colors} />
              {past.map((order, i) => (
                <OrderCard
                  key={order.ref}
                  order={order}
                  index={i + active.length}
                  colors={colors}
                  styles={styles}
                />
              ))}
            </>
          )}
          <View style={{ height: 60 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

function SectionHeader({ label, count, colors }: { label: string; count: number; colors: Palette }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, marginTop: 4 }}>
      <View style={{ width: 4, height: 16, borderRadius: 2, backgroundColor: colors.primary }} />
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.textPrimary }}>{label}</Text>
      <View style={{ backgroundColor: colors.primaryPale, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
        <Text style={{ fontSize: 11, color: colors.primary, fontWeight: '700' }}>{count}</Text>
      </View>
    </View>
  )
}

function OrderCard({ order, index, colors, styles, onTrack }: {
  order: ApiOrder; index: number; colors: Palette; styles: ReturnType<typeof makeStyles>; onTrack?: () => void
}) {
  const statusColor = STATUS_COLOR[order.status] ?? '#6B7280'
  const statusLabel = STATUS_LABEL[order.status] ?? order.status
  const items = order.items ?? []
  const itemSummary = items.slice(0, 2).map(i => `${i.qty}× ${i.name}`).join(', ')
    + (items.length > 2 ? ` +${items.length - 2}` : '')
  const dateLabel = order.placedAt
    ? new Date(order.placedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    : ''

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).springify().damping(16)}>
      <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={[styles.cardStub, { backgroundColor: statusColor }]} />
        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <Text style={[styles.merchantName, { color: colors.textPrimary }]} numberOfLines={1}>
              {order.merchantName || 'Order'}
            </Text>
            <Text style={[styles.total, { color: colors.textPrimary }]}>${(order.total ?? 0).toFixed(2)}</Text>
          </View>

          {itemSummary ? (
            <Text style={[styles.itemSummary, { color: colors.textMuted }]} numberOfLines={1}>{itemSummary}</Text>
          ) : null}

          <View style={styles.cardBottom}>
            <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
              <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
              <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
            {dateLabel ? (
              <Text style={[styles.dateText, { color: colors.textLight }]}>{dateLabel}</Text>
            ) : null}
          </View>

          <Text style={[styles.refText, { color: colors.textLight }]}>#{order.ref}</Text>

          {onTrack && (
            <Pressable onPress={onTrack} style={[styles.trackBtn, { backgroundColor: colors.primary }]}>
              <Ionicons name="navigate-outline" size={13} color="#fff" />
              <Text style={styles.trackText}>Track order</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe:     { flex: 1, backgroundColor: colors.background },
  topBar:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn:  { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700' },
  content:  { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 40 },
  emptyIcon:    { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle:   { fontSize: 20, fontWeight: '700' },
  emptySub:     { fontSize: 14, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  retryBtn:     { marginTop: 8, borderWidth: 1, paddingHorizontal: 24, paddingVertical: 10, borderRadius: 100 },
  card:         { borderRadius: radius.lg, borderWidth: 1, marginBottom: 12, overflow: 'hidden', flexDirection: 'row' },
  cardStub:     { width: 4 },
  cardBody:     { flex: 1, padding: 14, gap: 6 },
  cardTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  merchantName: { fontSize: 15, fontWeight: '700', flex: 1, marginRight: 8 },
  total:        { fontSize: 15, fontWeight: '700' },
  itemSummary:  { fontSize: 12 },
  cardBottom:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },
  statusBadge:  { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 100 },
  statusDot:    { width: 6, height: 6, borderRadius: 3 },
  statusText:   { fontSize: 11, fontWeight: '700' },
  dateText:     { fontSize: 11 },
  refText:      { fontSize: 10 },
  trackBtn:     { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderRadius: 100, alignSelf: 'flex-start', marginTop: 4 },
  trackText:    { color: '#fff', fontSize: 12, fontWeight: '700' },
})
