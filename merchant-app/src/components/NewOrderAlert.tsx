import React, { useEffect } from 'react'
import { View, Modal, StyleSheet, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, {
  FadeIn, SlideInUp, useSharedValue, useAnimatedStyle, withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { useOrders } from '../context/OrdersContext'
import { RootStackParamList } from '../navigation'
import AppText from './AppText'
import Tappable from './Tappable'

type Nav = NativeStackNavigationProp<RootStackParamList>

// The merchant's real-time "ping": a full-screen alert the moment a new order
// lands from a customer, so the kitchen never misses one.
export default function NewOrderAlert() {
  const { colors } = useTheme()
  const nav = useNavigation<Nav>()
  const { incomingOrder, dismissIncoming, acceptOrder } = useOrders()

  const ring = useSharedValue(0)
  useEffect(() => {
    if (incomingOrder) {
      ring.value = 0
      ring.value = withRepeat(withSequence(
        withTiming(1, { duration: 900, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 0 }),
      ), -1, false)
    }
  }, [incomingOrder])
  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + ring.value * 0.8 }],
    opacity: 0.5 * (1 - ring.value),
  }))

  if (!incomingOrder) return null
  const o = incomingOrder
  const itemsSummary = o.items.map(i => `${i.qty}× ${i.name}`).join(', ')

  const view = () => { dismissIncoming(); nav.navigate('OrderDetail', { orderId: o.id }) }
  const accept = () => { acceptOrder(o.id); dismissIncoming(); nav.navigate('OrderDetail', { orderId: o.id }) }

  return (
    <Modal visible transparent animationType="fade" onRequestClose={dismissIncoming}>
      <View style={styles.backdrop}>
        <Animated.View entering={SlideInUp.springify().damping(16)} style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.iconWrap}>
            <Animated.View style={[styles.ring, ringStyle, { borderColor: colors.orange }]} />
            <View style={[styles.iconCore, { backgroundColor: colors.orange }]}>
              <Ionicons name="flash" size={30} color="#fff" />
            </View>
          </View>

          <AppText variant="label" style={{ color: colors.orange, marginTop: 18 }}>New order · {o.ref}</AppText>
          <AppText variant="h1" style={{ color: colors.textPrimary, marginTop: 6 }}>{o.customerName}</AppText>
          <AppText variant="body" style={{ color: colors.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 }} numberOfLines={2}>
            {itemsSummary}
          </AppText>

          <View style={[styles.totalPill, { backgroundColor: colors.primaryPale }]}>
            <AppText variant="num" style={{ color: colors.primary, fontSize: 22 }}>${o.total.toFixed(2)}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted }}>{o.items.length} items · {o.address}</AppText>
          </View>

          <Tappable onPress={accept} style={[styles.acceptBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <AppText variant="bodyBold" style={{ color: '#fff', fontSize: 15 }}>Accept order</AppText>
          </Tappable>
          <View style={styles.secondaryRow}>
            <Pressable onPress={view} style={styles.secondaryBtn}>
              <AppText variant="bodySemi" style={{ color: colors.textSecondary }}>View details</AppText>
            </Pressable>
            <Pressable onPress={dismissIncoming} style={styles.secondaryBtn}>
              <AppText variant="bodySemi" style={{ color: colors.textMuted }}>Dismiss</AppText>
            </Pressable>
          </View>
        </Animated.View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(4,10,18,0.85)', justifyContent: 'flex-end', padding: spacing.md, paddingBottom: 36 },
  sheet: { ...cut.sheet, borderWidth: 1, padding: spacing.xl, alignItems: 'center' },
  iconWrap: { width: 72, height: 72, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: 72, height: 72, borderRadius: 36, borderWidth: 3 },
  iconCore: { width: 60, height: 60, borderRadius: 30, alignItems: 'center', justifyContent: 'center' },
  totalPill: { alignItems: 'center', gap: 2, borderRadius: 16, paddingVertical: 12, paddingHorizontal: 20, marginTop: 16, alignSelf: 'stretch' },
  acceptBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, alignSelf: 'stretch', borderRadius: 100, paddingVertical: 16, marginTop: 18 },
  secondaryRow: { flexDirection: 'row', gap: 24, marginTop: 6 },
  secondaryBtn: { paddingVertical: 12, paddingHorizontal: 8 },
})
