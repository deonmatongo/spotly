import React from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { MerchantOrder, OrderStatus } from '../data/mock'
import { Palette } from '../context/ThemeContext'
import { cut, spacing } from '../theme'
import AppText from './AppText'
import Tappable from './Tappable'

const STATUS_META: Record<OrderStatus, { label: string; icon: keyof typeof Ionicons.glyphMap; color: string }> = {
  new: { label: 'New', icon: 'flash', color: '#F97316' },
  preparing: { label: 'Preparing', icon: 'flame', color: '#F59E0B' },
  ready: { label: 'Ready', icon: 'checkmark-circle', color: '#22C55E' },
  done: { label: 'Done', icon: 'checkmark-done-circle', color: '#64748B' },
  declined: { label: 'Declined', icon: 'close-circle', color: '#EF4444' },
}

interface Props {
  order: MerchantOrder
  index: number
  colors: Palette
  onPress: () => void
}

export default function OrderCard({ order, index, colors, onPress }: Props) {
  const meta = STATUS_META[order.status]
  const itemsSummary = order.items.map(i => `${i.qty}× ${i.name}`).join(', ')

  return (
    <Animated.View entering={FadeInDown.delay(index * 55).springify().damping(16)}>
      <Tappable onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: order.status === 'new' ? colors.orange : colors.border }]}>
        {order.status === 'new' && <View style={[styles.urgentStub, { backgroundColor: colors.orange }]} />}
        <View style={styles.header}>
          <View style={[styles.statusPill, { backgroundColor: meta.color + '22' }]}>
            <Ionicons name={meta.icon} size={12} color={meta.color} />
            <AppText variant="label" style={{ fontSize: 9.5, color: meta.color, letterSpacing: 0.8 }}>{meta.label}</AppText>
          </View>
          <AppText variant="label" style={{ fontSize: 9.5, color: colors.textLight }}>{order.placedAt}</AppText>
        </View>

        <View style={styles.body}>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{order.customerName}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 3 }} numberOfLines={1}>{itemsSummary}</AppText>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 16 }}>${order.total.toFixed(2)}</AppText>
            <AppText variant="label" style={{ fontSize: 9.5, color: colors.textLight, letterSpacing: 0.5 }}>{order.ref}</AppText>
          </View>
        </View>

        <View style={styles.footer}>
          <Ionicons name="person-outline" size={11} color={colors.textLight} />
          <AppText variant="caption" style={{ color: colors.textLight, flex: 1 }} numberOfLines={1}>
            {order.address}
          </AppText>
          <Ionicons name="chevron-forward" size={14} color={colors.textLight} />
        </View>
      </Tappable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    ...cut.chip,
    borderWidth: 1,
    marginBottom: 10,
    overflow: 'hidden',
  },
  urgentStub: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingTop: 12, paddingBottom: 8 },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 100 },
  body: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingBottom: 10 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.05)' },
})
