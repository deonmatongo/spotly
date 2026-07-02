import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Image } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { useCart } from '../context/CartContext'

const HEADER_COLORS = ['#166534', '#15803D', '#16A34A'] as const

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function CartScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<Nav>()
  const canGoBack = nav.canGoBack()
  const { items, updateQty, clearCart } = useCart()

  const subtotal = items.reduce((s, i) => s + i.price * i.qty, 0)
  const delivery = subtotal >= 20 ? 0 : 3.99
  const total = subtotal + delivery

  if (items.length === 0) return (
    <View style={styles.safe}>
      <LinearGradient colors={HEADER_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBarRow}>
            {canGoBack ? (
              <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.white} />
              </Pressable>
            ) : <View style={{ width: 36 }} />}
            <Text style={styles.topTitle}>Cart</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
      <View style={styles.emptyWrap}>
        <Ionicons name="bag-outline" size={56} color={colors.textLight} />
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptySub}>Add items from restaurants and grocery stores</Text>
        <Pressable onPress={() => (nav as any).navigate('Search')} style={styles.browseBtn}>
          <Text style={styles.browseBtnText}>Browse Now</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <View style={styles.safe}>
      <LinearGradient colors={HEADER_COLORS} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBarRow}>
            {canGoBack ? (
              <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={22} color={colors.white} />
              </Pressable>
            ) : <View style={{ width: 36 }} />}
            <Text style={styles.topTitle}>Your Cart</Text>
            <Pressable onPress={clearCart}>
              <Text style={styles.clearText}>Clear</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={styles.deliveryBanner}>
        <Ionicons name="bicycle-outline" size={16} color={colors.primary} />
        <Text style={styles.deliveryText}>
          {subtotal >= 20 ? '🎉 Free delivery on your order!' : `Add $${(20 - subtotal).toFixed(2)} more for free delivery`}
        </Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.map(item => (
          <View key={item.id} style={styles.itemRow}>
            <Image source={{ uri: item.image }} style={styles.itemImg} />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemFrom}>{item.from}</Text>
              <Text style={styles.itemPrice}>${(item.price * item.qty).toFixed(2)}</Text>
            </View>
            <View style={styles.qtyWrap}>
              <Pressable onPress={() => updateQty(item.id, -1)} style={styles.qtyBtn}>
                <Ionicons name={item.qty === 1 ? 'trash-outline' : 'remove'} size={14} color={item.qty === 1 ? colors.red : colors.textPrimary} />
              </Pressable>
              <Text style={styles.qtyNum}>{item.qty}</Text>
              <Pressable onPress={() => updateQty(item.id, 1)} style={[styles.qtyBtn, styles.qtyAdd]}>
                <Ionicons name="add" size={14} color={colors.white} />
              </Pressable>
            </View>
          </View>
        ))}

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Subtotal</Text>
            <Text style={styles.summaryValue}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Delivery fee</Text>
            <Text style={[styles.summaryValue, delivery === 0 && { color: colors.primary, fontWeight: '700' }]}>
              {delivery === 0 ? 'FREE' : `$${delivery.toFixed(2)}`}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotal}>Total</Text>
            <Text style={styles.summaryTotal}>${total.toFixed(2)}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable onPress={() => nav.navigate('Checkout', { subtotal, deliveryFee: delivery, total })} style={styles.cta}>
          <Ionicons name="bicycle-outline" size={18} color={colors.white} />
          <Text style={styles.ctaText}>Proceed to Checkout · ${total.toFixed(2)}</Text>
        </Pressable>
      </View>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.md, paddingBottom: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  clearText: { fontSize: 14, color: colors.white, fontWeight: '700' },
  deliveryBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryPale, margin: spacing.md, borderRadius: radius.lg, padding: 12 },
  deliveryText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 10, marginBottom: 10 },
  itemImg: { width: 56, height: 56, borderRadius: radius.md },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  itemFrom: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  itemPrice: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  qtyWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  qtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  qtyAdd: { backgroundColor: colors.primary, borderColor: colors.primary },
  qtyNum: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, minWidth: 16, textAlign: 'center' },
  summaryCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginTop: 8 },
  summaryTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  summaryTotal: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaText: { fontSize: 15, fontWeight: '700', color: colors.white },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: spacing.xl },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },
  browseBtn: { backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14, borderRadius: radius.lg, marginTop: 8 },
  browseBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
