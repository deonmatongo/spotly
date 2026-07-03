import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Image, Modal } from 'react-native'

const PAYMENT_METHODS = [
  { id: 'visa',       logo: 'VISA',     bg: '#1A1F71', fg: '#FFFFFF', label: 'Visa •••• 4242',          sub: 'Expires 08/27' },
  { id: 'mastercard', logo: 'MC',       bg: '#EB001B', fg: '#FFFFFF', label: 'Mastercard •••• 8891',     sub: 'Expires 03/28' },
  { id: 'apple',      logo: '',        bg: '#000000', fg: '#FFFFFF', label: 'Apple Pay',                sub: 'Touch ID required' },
  { id: 'ecocash',    logo: 'eco',      bg: '#E31837', fg: '#FFFFFF', label: 'EcoCash',                  sub: '+263 77 234 5678' },
  { id: 'points',     logo: '★',        bg: '#15803D', fg: '#FFFFFF', label: 'Spotly Points',            sub: '1,240 pts available' },
]
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { useCart } from '../context/CartContext'
import { useTickets } from '../context/TicketsContext'
import { useNotifications } from '../context/NotificationsContext'
import { currentUser, offers, Offer } from '../data/mock'
import { orderBus } from '../services/orderBus'
import {
  Order, DEMO_MERCHANT_ID, DEMO_MERCHANT_NAME, MERCHANT_COORD, FALLBACK_DROPOFF,
} from '@spotly/shared'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'Checkout'>

function discountFor(offer: Offer | null, subtotal: number, deliveryFee: number): number {
  if (!offer) return 0
  if (subtotal < offer.minSpend) return 0
  if (offer.discountType === 'shipping') return deliveryFee
  if (offer.discountType === 'flat') return Math.min(offer.amount, subtotal)
  // percent — capped at $25 to stay realistic
  return Math.min((subtotal * offer.amount) / 100, 25)
}

export default function CheckoutScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<Nav>()
  const { subtotal, deliveryFee, total } = useRoute<Route>().params
  const { items, totalItems, clearCart, hasTickets } = useCart()
  const { addTicket } = useTickets()
  const { addNotification } = useNotifications()
  const [mode, setMode] = useState<'delivery' | 'pickup'>('delivery')
  const [payMethod, setPayMethod] = useState('card')
  const [ticketEmail, setTicketEmail] = useState(currentUser.email)
  const [promoInput, setPromoInput] = useState('')
  const [appliedOffer, setAppliedOffer] = useState<Offer | null>(null)
  const [promoError, setPromoError] = useState('')
  const [address, setAddress] = useState('14 Borrowdale Road, Borrowdale, Harare')
  const [addressNote, setAddressNote] = useState('Gate 3 · Call on arrival')
  const [editAddr, setEditAddr] = useState(false)
  const [draftAddr, setDraftAddr] = useState('')
  const [draftNote, setDraftNote] = useState('')

  const openEditAddr = () => { setDraftAddr(address); setDraftNote(addressNote); setEditAddr(true) }
  const saveAddr = () => {
    if (draftAddr.trim()) setAddress(draftAddr.trim())
    setAddressNote(draftNote.trim())
    setEditAddr(false)
  }

  const discount = discountFor(appliedOffer, subtotal, deliveryFee)
  const finalTotal = Math.max(0, total - discount)

  const applyPromo = () => {
    const code = promoInput.trim().toUpperCase()
    if (!code) return
    const offer = offers.find(o => o.code === code)
    if (!offer) { setPromoError('That code isn’t valid. Try FRESH20 or SPOTLY10.'); setAppliedOffer(null); return }
    if (subtotal < offer.minSpend) { setPromoError(`Spend $${offer.minSpend} to use ${offer.code}.`); setAppliedOffer(null); return }
    setPromoError('')
    setAppliedOffer(offer)
  }

  const ticketItems = items.filter(i => i.itemType === 'ticket')
  const foodItems = items.filter(i => i.itemType === 'food')

  const handlePlaceOrder = () => {
    const orderNum = `SPT-${Math.floor(1000 + Math.random() * 9000)}`
    const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })

    if (hasTickets) {
      // Save each unique ticket event to tickets context
      const seen = new Set<string>()
      ticketItems.forEach(item => {
        if (!item.eventMeta) return
        const key = `${item.eventMeta.eventId}-${item.id}`
        if (seen.has(key)) return
        seen.add(key)
        addTicket({
          id: `${orderNum}-${item.id}`,
          eventId: item.eventMeta.eventId,
          eventName: item.from,
          eventImage: item.image,
          eventDate: item.eventMeta.eventDate,
          eventTime: item.eventMeta.eventTime,
          venue: item.eventMeta.venue,
          tierName: item.eventMeta.tierName,
          tierColor: '#15803D',
          quantity: item.qty,
          totalPrice: item.price * item.qty,
          confirmationCode: orderNum,
          email: ticketEmail,
          purchasedAt: now,
          status: 'upcoming',
        })
      })
    }

    const itemCount = totalItems
    clearCart()

    if (hasTickets && foodItems.length === 0) {
      addNotification({
        type: 'ticket',
        title: 'Tickets confirmed 🎟️',
        body: `Your tickets for ${ticketItems[0]?.from ?? 'the event'} are booked. Ref ${orderNum} · sent to ${ticketEmail}.`,
      })
      nav.replace('TicketConfirmation', {
        orderNumber: orderNum,
        email: ticketEmail,
        eventName: ticketItems[0]?.from ?? 'Event',
        total: finalTotal,
        items: itemCount,
        eventDate: ticketItems[0]?.eventMeta?.eventDate ?? '',
        eventTime: ticketItems[0]?.eventMeta?.eventTime ?? '',
        venue: ticketItems[0]?.eventMeta?.venue ?? '',
      })
    } else {
      // Publish the order onto the bus so the merchant app receives it live and
      // (once ready) a driver can be dispatched. All demo orders route to the
      // single merchant (Amanzi), which is also the tracking pickup point.
      const order: Order = {
        ref: orderNum,
        merchantId: DEMO_MERCHANT_ID,
        merchantName: foodItems[0]?.from ?? DEMO_MERCHANT_NAME,
        customerName: currentUser.name,
        customerPhone: (currentUser as any).phone ?? '+263 77 000 0000',
        items: foodItems.map(i => ({ id: i.id, name: i.name, qty: i.qty, unitPrice: i.price })),
        subtotal,
        deliveryFee,
        total: finalTotal,
        status: 'placed',
        placedAt: Date.now(),
        address: mode === 'delivery' ? address : 'Collection at store',
        addressNote: mode === 'delivery' ? addressNote : undefined,
        pickupCoord: MERCHANT_COORD,
        dropoffCoord: FALLBACK_DROPOFF,
        prepMinutes: 20,
      }
      orderBus.placeOrder(order)

      addNotification({
        type: 'order',
        title: 'Order placed 🛵',
        body: `Order ${orderNum} confirmed${mode === 'delivery' ? ' — your rider is on the way' : ' for pickup'}. Total $${finalTotal.toFixed(2)}.`,
      })
      nav.replace('OrderTracking', { orderNumber: orderNum, total: finalTotal, items: itemCount })
    }
  }

  return (
    <View style={styles.safe}>
      <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.topBar}>
        <SafeAreaView edges={['top']}>
          <View style={styles.topBarRow}>
            <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
            <Text style={styles.topTitle}>Checkout</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

          {/* Delivery toggle — only for food */}
          {foodItems.length > 0 && (
            <>
              <View style={styles.toggle}>
                {(['delivery', 'pickup'] as const).map(m => (
                  <Pressable key={m} onPress={() => setMode(m)} style={[styles.toggleBtn, mode === m && styles.toggleBtnActive]}>
                    <Ionicons name={m === 'delivery' ? 'bicycle-outline' : 'storefront-outline'} size={16} color={mode === m ? colors.primary : colors.textMuted} />
                    <Text style={[styles.toggleText, mode === m && styles.toggleTextActive]}>
                      {m.charAt(0).toUpperCase() + m.slice(1)}
                    </Text>
                  </Pressable>
                ))}
              </View>

              {mode === 'delivery' && (
                <>
                  <Text style={styles.label}>Delivery address</Text>
                  <Pressable style={styles.addressCard} onPress={openEditAddr}>
                    <View style={styles.addressIcon}><Ionicons name="location" size={18} color={colors.primary} /></View>
                    <View style={styles.addressInfo}>
                      <Text style={styles.addressMain}>{address}</Text>
                      {!!addressNote && <Text style={styles.addressSub}>{addressNote}</Text>}
                    </View>
                    <Text style={styles.editBtn}>Edit</Text>
                  </Pressable>
                </>
              )}
            </>
          )}

          {/* Ticket email — only when buying tickets */}
          {hasTickets && (
            <View style={styles.ticketEmailSection}>
              <View style={styles.ticketEmailHeader}>
                <Ionicons name="ticket-outline" size={18} color={colors.primary} />
                <Text style={styles.ticketEmailTitle}>Send Tickets To</Text>
              </View>
              <Text style={styles.ticketEmailSub}>Your tickets will be emailed and saved in the app</Text>
              <View style={styles.emailInputRow}>
                <Ionicons name="mail-outline" size={18} color={colors.textMuted} />
                <TextInput
                  value={ticketEmail}
                  onChangeText={setTicketEmail}
                  placeholder="your@email.com"
                  placeholderTextColor={colors.textLight}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.emailInput}
                />
              </View>
              {ticketItems.map(item => (
                <View key={item.id} style={styles.ticketSummaryRow}>
                  <View style={styles.ticketIconBadge}>
                    <Ionicons name="ticket" size={14} color={colors.primary} />
                  </View>
                  <View style={styles.ticketSummaryInfo}>
                    <Text style={styles.ticketSummaryName}>{item.from}</Text>
                    <Text style={styles.ticketSummaryTier}>{item.qty}× {item.eventMeta?.tierName}</Text>
                  </View>
                  <Text style={styles.ticketSummaryPrice}>${(item.price * item.qty).toFixed(2)}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Promo code */}
          <Text style={styles.label}>Promo code</Text>
          {appliedOffer ? (
            <View style={styles.promoApplied}>
              <View style={styles.promoTagIcon}><Ionicons name="pricetag" size={16} color={colors.primary} /></View>
              <View style={{ flex: 1 }}>
                <Text style={styles.promoAppliedCode}>{appliedOffer.code} applied</Text>
                <Text style={styles.promoAppliedSub}>{appliedOffer.title} · −${discount.toFixed(2)}</Text>
              </View>
              <Pressable onPress={() => { setAppliedOffer(null); setPromoInput(''); }} hitSlop={8}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          ) : (
            <>
              <View style={styles.promoRow}>
                <View style={styles.promoInputWrap}>
                  <Ionicons name="pricetag-outline" size={16} color={colors.textMuted} />
                  <TextInput
                    value={promoInput}
                    onChangeText={t => { setPromoInput(t); setPromoError('') }}
                    placeholder="Enter code (e.g. FRESH20)"
                    placeholderTextColor={colors.textLight}
                    autoCapitalize="characters"
                    style={styles.promoInput}
                  />
                </View>
                <Pressable onPress={applyPromo} style={[styles.promoApplyBtn, !promoInput.trim() && { opacity: 0.5 }]} disabled={!promoInput.trim()}>
                  <Text style={styles.promoApplyText}>Apply</Text>
                </Pressable>
              </View>
              {!!promoError && <Text style={styles.promoError}>{promoError}</Text>}
            </>
          )}

          {/* Payment */}
          <Text style={styles.label}>Payment method</Text>
          {PAYMENT_METHODS.map(m => (
            <Pressable key={m.id} onPress={() => setPayMethod(m.id)} style={[styles.payCard, payMethod === m.id && styles.payCardActive]}>
              <View style={[styles.payLogoBox, { backgroundColor: m.bg }]}>
                <Text style={[styles.payLogoText, { color: m.fg }]}>{m.logo}</Text>
              </View>
              <View style={styles.payInfo}>
                <Text style={styles.payLabel}>{m.label}</Text>
                <Text style={styles.paySub}>{m.sub}</Text>
              </View>
              <View style={[styles.radio, payMethod === m.id && styles.radioActive]}>
                {payMethod === m.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}

          {/* Order summary */}
          <Text style={styles.label}>Order summary</Text>
          <View style={styles.summaryCard}>
            {[['Subtotal', `$${subtotal.toFixed(2)}`], ['Delivery / Fees', deliveryFee === 0 ? 'FREE' : `$${deliveryFee.toFixed(2)}`]].map(([l, v]) => (
              <View key={l} style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>{l}</Text>
                <Text style={[styles.summaryValue, v === 'FREE' && { color: colors.primary, fontWeight: '700' }]}>{v}</Text>
              </View>
            ))}
            {discount > 0 && (
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: colors.primary }]}>Promo ({appliedOffer?.code})</Text>
                <Text style={[styles.summaryValue, { color: colors.primary, fontWeight: '700' }]}>−${discount.toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTotal}>Total</Text>
              <Text style={styles.summaryTotal}>${finalTotal.toFixed(2)}</Text>
            </View>
          </View>

          <View style={styles.earnBadgeInline}>
            <Ionicons name="sparkles" size={15} color={colors.primary} />
            <Text style={styles.earnText}>You'll earn Spotly Points on this order</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable onPress={handlePlaceOrder} style={styles.cta}>
          <Text style={styles.ctaText}>{hasTickets ? 'Buy Tickets' : 'Place Order'} · ${finalTotal.toFixed(2)}</Text>
        </Pressable>
      </View>

      {/* Edit delivery address */}
      <Modal visible={editAddr} transparent animationType="slide" onRequestClose={() => setEditAddr(false)}>
        <Pressable style={styles.addrOverlay} onPress={() => setEditAddr(false)} />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={[styles.addrSheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.addrHandle} />
            <Text style={styles.addrTitle}>Delivery address</Text>

            <Text style={styles.addrLabel}>Street address</Text>
            <TextInput
              value={draftAddr}
              onChangeText={setDraftAddr}
              placeholder="Street, suburb, city"
              placeholderTextColor={colors.textLight}
              style={styles.addrInput}
              multiline
            />

            <Text style={styles.addrLabel}>Delivery note (optional)</Text>
            <TextInput
              value={draftNote}
              onChangeText={setDraftNote}
              placeholder="Gate code, landmark, instructions…"
              placeholderTextColor={colors.textLight}
              style={styles.addrInput}
            />

            <Pressable style={[styles.addrSave, !draftAddr.trim() && { opacity: 0.5 }]} onPress={saveAddr} disabled={!draftAddr.trim()}>
              <Text style={styles.addrSaveText}>Save address</Text>
            </Pressable>
            <Pressable style={styles.addrCancel} onPress={() => setEditAddr(false)}>
              <Text style={styles.addrCancelText}>Cancel</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  addrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' },
  addrSheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  addrHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  addrTitle: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, marginBottom: 16 },
  addrLabel: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  addrInput: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: colors.textPrimary, marginBottom: 16 },
  addrSave: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 15, alignItems: 'center', marginTop: 4 },
  addrSaveText: { fontSize: 15, fontWeight: '700', color: colors.white },
  addrCancel: { paddingVertical: 14, alignItems: 'center', marginTop: 4 },
  addrCancelText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
  topBar: { paddingHorizontal: spacing.md, paddingBottom: 14, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  topBarRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingBottom: 120 },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 4, marginVertical: 16 },
  toggleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 10, borderRadius: radius.md },
  toggleBtnActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: 14, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: colors.primary },
  label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 4 },
  addressCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: colors.border },
  addressIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  addressInfo: { flex: 1 },
  addressMain: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  addressSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  editBtn: { fontSize: 13, fontWeight: '700', color: colors.primary },

  ticketEmailSection: { backgroundColor: colors.primaryPale, borderRadius: radius.lg, padding: 14, marginVertical: 12, gap: 10 },
  ticketEmailHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ticketEmailTitle: { fontSize: 15, fontWeight: '700', color: colors.primary },
  ticketEmailSub: { fontSize: 12, color: colors.textMuted, marginTop: -4 },
  emailInputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface, borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: colors.primaryBorder },
  emailInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  ticketSummaryRow: { flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 1, borderTopColor: colors.primaryBorder, paddingTop: 8 },
  ticketIconBadge: { width: 28, height: 28, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  ticketSummaryInfo: { flex: 1 },
  ticketSummaryName: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  ticketSummaryTier: { fontSize: 12, color: colors.textMuted },
  ticketSummaryPrice: { fontSize: 14, fontWeight: '700', color: colors.primary },

  payCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8 },
  payCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  payLogoBox: { width: 48, height: 30, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  payLogoText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  payInfo: { flex: 1 },
  payLabel: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  paySub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  promoRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  promoInputWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1.5, borderColor: colors.border },
  promoInput: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0, letterSpacing: 1 },
  promoApplyBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 20, alignItems: 'center', justifyContent: 'center' },
  promoApplyText: { fontSize: 14, fontWeight: '700', color: colors.white },
  promoError: { fontSize: 12, color: colors.red, marginBottom: 8 },
  promoApplied: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryPale, borderRadius: radius.lg, padding: 12, borderWidth: 1, borderColor: colors.primaryBorder, marginBottom: 8 },
  promoTagIcon: { width: 32, height: 32, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  promoAppliedCode: { fontSize: 14, fontWeight: '800', color: colors.primary, letterSpacing: 1 },
  promoAppliedSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  summaryCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryValue: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 8 },
  summaryTotal: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  earnBadgeInline: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryPale, borderRadius: radius.lg, padding: 12 },
  earnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaText: { fontSize: 15, fontWeight: '700', color: colors.white },
})
