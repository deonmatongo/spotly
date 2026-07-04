import React from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useOrders } from '../context/OrdersContext'
import { RootStackParamList } from '../navigation'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'
import OrderTimer from '../components/OrderTimer'
import RiderApproachMap from '../components/RiderApproachMap'

type Route = RouteProp<RootStackParamList, 'OrderDetail'>

const STATUS_ACTIONS: Record<string, { label: string; next: string; action: string; icon: string; color: string } | null> = {
  new: { label: 'Accept order', next: 'Preparing', action: 'accept', icon: 'checkmark-circle', color: '#22C55E' },
  preparing: { label: 'Mark as ready', next: 'Ready for pickup', action: 'ready', icon: 'bag-check', color: '#F59E0B' },
  ready: { label: 'Mark as done', next: 'Done', action: 'done', icon: 'checkmark-done-circle', color: '#3B82F6' },
  done: null,
  declined: null,
}

export default function OrderDetailScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const route = useRoute<Route>()
  const { getOrder, acceptOrder, markReady, markDone, declineOrder } = useOrders()

  const order = getOrder(route.params.orderId)
  if (!order) return null

  const action = STATUS_ACTIONS[order.status]

  const handleAction = () => {
    if (order.status === 'new') acceptOrder(order.id)
    else if (order.status === 'preparing') markReady(order.id)
    else if (order.status === 'ready') markDone(order.id)
  }

  const statusColor = order.status === 'new' ? colors.orange
    : order.status === 'preparing' ? colors.amber
    : order.status === 'ready' ? colors.primary
    : colors.textMuted

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" style={{ color: colors.textPrimary }}>{order.ref}</AppText>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <AppText variant="caption" style={{ color: colors.textMuted }}>Placed {order.placedAt}</AppText>
            {order.placedTs && order.status !== 'done' && order.status !== 'declined' && (
              <OrderTimer placedTs={order.placedTs} colors={colors} />
            )}
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '22' }]}>
          <AppText variant="label" style={{ fontSize: 10, color: statusColor, letterSpacing: 0.6 }}>{order.status.toUpperCase()}</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Customer info */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="label" style={{ color: colors.textLight, marginBottom: 12 }}>Customer</AppText>
          <View style={styles.infoRow}>
            <View style={[styles.infoIcon, { backgroundColor: colors.primaryPale }]}>
              <Ionicons name="person" size={15} color={colors.primary} />
            </View>
            <View>
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{order.customerName}</AppText>
              <AppText variant="caption" style={{ color: colors.textMuted }}>{order.customerPhone}</AppText>
            </View>
          </View>
          <View style={[styles.infoRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider }]}>
            <View style={[styles.infoIcon, { backgroundColor: colors.surfaceAlt }]}>
              <Ionicons name="location" size={15} color={colors.textSecondary} />
            </View>
            <AppText variant="body" style={{ color: colors.textSecondary, flex: 1 }}>{order.address}</AppText>
          </View>
          {order.driverName && (
            <View style={[styles.infoRow, { marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.divider }]}>
              <View style={[styles.infoIcon, { backgroundColor: colors.bluePale }]}>
                <Ionicons name="bicycle" size={15} color={colors.blue} />
              </View>
              <AppText variant="body" style={{ color: colors.textSecondary }}>Driver: {order.driverName}</AppText>
            </View>
          )}
        </Animated.View>

        {/* Live: rider approaching the store to collect */}
        {order.driverName && (order.status === 'ready' || order.status === 'done') && (
          <Animated.View entering={FadeInDown.delay(40).springify().damping(16)} style={{ marginBottom: spacing.md }}>
            <View style={styles.trackHead}>
              <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
              <AppText variant="h3" style={{ color: colors.textPrimary, flex: 1 }}>{order.driverName} is collecting</AppText>
            </View>
            <RiderApproachMap tripRef={order.ref} colors={colors} />
          </Animated.View>
        )}

        {/* Items */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <AppText variant="label" style={{ color: colors.textLight, marginBottom: 12 }}>Order items</AppText>
          {order.items.map((item, i) => (
            <View key={item.id} style={[styles.itemRow, i < order.items.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.divider }]}>
              <View style={[styles.qtyBadge, { backgroundColor: colors.primaryPale }]}>
                <AppText variant="label" style={{ fontSize: 10, color: colors.primary, letterSpacing: 0 }}>×{item.qty}</AppText>
              </View>
              <AppText variant="bodySemi" style={{ color: colors.textPrimary, flex: 1 }}>{item.name}</AppText>
              <AppText variant="num" style={{ color: colors.textSecondary, fontSize: 14 }}>${(item.unitPrice * item.qty).toFixed(2)}</AppText>
            </View>
          ))}
          <View style={[styles.totalBlock, { borderTopColor: colors.border }]}>
            <View style={styles.totalRow}>
              <AppText variant="body" style={{ color: colors.textMuted }}>Subtotal</AppText>
              <AppText variant="num" style={{ color: colors.textSecondary, fontSize: 14 }}>${order.subtotal.toFixed(2)}</AppText>
            </View>
            <View style={styles.totalRow}>
              <AppText variant="body" style={{ color: colors.textMuted }}>Delivery fee</AppText>
              <AppText variant="num" style={{ color: colors.textSecondary, fontSize: 14 }}>${order.deliveryFee.toFixed(2)}</AppText>
            </View>
            <View style={[styles.totalRow, { marginTop: 6 }]}>
              <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Total</AppText>
              <AppText variant="num" style={{ color: colors.primary, fontSize: 18 }}>${order.total.toFixed(2)}</AppText>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action footer */}
      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {order.status === 'new' && (
          <Tappable onPress={() => declineOrder(order.id)} style={[styles.secondaryBtn, { borderColor: colors.border }]}>
            <AppText variant="bodyBold" style={{ color: colors.textMuted }}>Decline</AppText>
          </Tappable>
        )}
        {action && (
          <Tappable onPress={handleAction} style={[styles.primaryBtn, { backgroundColor: action.color, flex: order.status === 'new' ? 1 : undefined }]}>
            <Ionicons name={action.icon as any} size={18} color="#fff" />
            <AppText variant="bodyBold" style={{ color: '#fff', fontSize: 15 }}>{action.label}</AppText>
          </Tappable>
        )}
        {!action && (
          <View style={styles.doneState}>
            <Ionicons name="checkmark-done-circle" size={20} color={colors.textLight} />
            <AppText variant="bodyBold" style={{ color: colors.textMuted }}>Order completed</AppText>
          </View>
        )}
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 100 },

  content: { padding: spacing.md },
  card: { ...cut.card, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trackHead: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },

  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  qtyBadge: { width: 30, height: 30, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },

  totalBlock: { borderTopWidth: 1, marginTop: 8, paddingTop: 12, gap: 6 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 32,
    flexDirection: 'row', gap: 10,
  },
  primaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    paddingVertical: 16, paddingHorizontal: 24, borderRadius: 100, flex: 2,
  },
  secondaryBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    paddingVertical: 16, paddingHorizontal: 20, borderRadius: 100, borderWidth: 1.5,
  },
  doneState: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
})
