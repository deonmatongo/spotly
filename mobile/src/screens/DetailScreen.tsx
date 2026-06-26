import React, { useState } from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet, Platform } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { TicketTier } from '../data/mock'
import { RootStackParamList } from '../navigation'
import { useCart } from '../context/CartContext'
import { useFavorites } from '../context/FavoritesContext'
import { useReviews } from '../context/ReviewsContext'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'Detail'>

const DATES = ['Tonight', 'Tomorrow', 'Sat Jun 28', 'Sun Jun 29']

export default function DetailScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<Nav>()
  const { listing } = useRoute<Route>().params
  const { isFavorite, toggleFavorite } = useFavorites()
  const { reviewsFor } = useReviews()
  const liked = isFavorite(listing.id)
  const [selectedDate, setSelectedDate] = useState('Tonight')
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [partySize, setPartySize] = useState(2)
  const [selectedTier, setSelectedTier] = useState<TicketTier | null>(listing.ticketTiers?.[0] ?? null)
  const [ticketQty, setTicketQty] = useState(1)
  const [addedToCart, setAddedToCart] = useState(false)

  const { addItem, updateQty: cartUpdateQty, items: cartItems } = useCart()
  const listingReviews = reviewsFor(listing.id)
  const isEvent = listing.category === 'events' && !!listing.ticketTiers?.length
  const isMenu = ['groceries', 'food'].includes(listing.category) && !!listing.menu
  const isBookable = !isEvent && !!listing.timeSlots?.length

  const getCartQtyForItem = (id: string) => cartItems.find(i => i.id === id)?.qty ?? 0
  const totalCartItemsForListing = cartItems.filter(i => i.from === listing.name).reduce((s, i) => s + i.qty, 0)

  const handleAddTicketsToCart = () => {
    if (!selectedTier) return
    const itemId = `evt-${listing.id}-${selectedTier.id}`
    addItem({
      id: itemId,
      name: `${selectedTier.name} Ticket`,
      price: selectedTier.price,
      image: listing.image,
      from: listing.name,
      itemType: 'ticket',
      eventMeta: {
        eventId: listing.id,
        eventDate: listing.eventDate ?? listing.hours,
        eventTime: listing.eventTime ?? '',
        venue: listing.address,
        tierName: selectedTier.name,
      },
    })
    if (ticketQty > 1) {
      for (let i = 1; i < ticketQty; i++) {
        addItem({
          id: itemId,
          name: `${selectedTier.name} Ticket`,
          price: selectedTier.price,
          image: listing.image,
          from: listing.name,
          itemType: 'ticket',
          eventMeta: {
            eventId: listing.id,
            eventDate: listing.eventDate ?? listing.hours,
            eventTime: listing.eventTime ?? '',
            venue: listing.address,
            tierName: selectedTier.name,
          },
        })
      }
    }
    setAddedToCart(true)
  }

  return (
    <View style={styles.root}>
      {/* Hero */}
      <View style={styles.hero}>
        <Image source={{ uri: listing.image }} style={styles.heroImg} />
        <View style={styles.heroOverlay} />
        <SafeAreaView edges={['top']} style={styles.heroBar}>
          <Pressable onPress={() => nav.goBack()} style={styles.heroBtn}>
            <Ionicons name="chevron-back" size={22} color={colors.dark} />
          </Pressable>
          <View style={styles.heroActions}>
            <Pressable onPress={() => toggleFavorite(listing.id)} style={styles.heroBtn}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? colors.primary : colors.dark} />
            </Pressable>
            <Pressable style={styles.heroBtn}>
              <Ionicons name="share-outline" size={20} color={colors.dark} />
            </Pressable>
          </View>
        </SafeAreaView>

        {/* Event date badge */}
        {isEvent && listing.eventDate && (
          <View style={styles.eventDateBadge}>
            <Ionicons name="calendar-outline" size={13} color={colors.white} />
            <Text style={styles.eventDateText}>{listing.eventDate}</Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}>
        {/* Info */}
        <View style={styles.infoSection}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{listing.name}</Text>
            <Text style={styles.price}>{listing.priceLevel}</Text>
          </View>
          <Text style={styles.cuisine}>{listing.cuisine}</Text>

          <View style={styles.metaRow}>
            <Ionicons name="star" size={14} color={colors.amber} />
            <Text style={styles.rating}>{listing.rating}</Text>
            <Text style={styles.reviewCount}>({listing.reviewCount})</Text>
            <View style={styles.dot} />
            <Ionicons name="location-outline" size={13} color={colors.textMuted} />
            <Text style={styles.metaText}>{listing.distance}</Text>
            {isEvent && listing.eventTime && (
              <>
                <View style={styles.dot} />
                <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                <Text style={styles.metaText}>{listing.eventTime}</Text>
              </>
            )}
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }} contentContainerStyle={{ gap: 8 }}>
            {listing.tags.map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </ScrollView>

          <Text style={styles.desc}>{listing.description}</Text>

          <View style={styles.addressRow}>
            <Ionicons name="location" size={15} color={colors.primary} />
            <Text style={styles.address}>{listing.address}</Text>
          </View>

          {!isEvent && (
            <View style={styles.mapPlaceholder}>
              <Ionicons name="map-outline" size={24} color={colors.primary} />
              <Text style={styles.mapText}>View on Maps</Text>
            </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* ── EVENTS: Ticket tiers ── */}
        {isEvent && listing.ticketTiers && (
          <View style={styles.eventSection}>
            <View style={styles.eventInfoRow}>
              <View style={styles.eventInfoItem}>
                <Ionicons name="calendar-outline" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.eventInfoLabel}>Date</Text>
                  <Text style={styles.eventInfoValue}>{listing.eventDate}</Text>
                </View>
              </View>
              <View style={styles.eventInfoDivider} />
              <View style={styles.eventInfoItem}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <View>
                  <Text style={styles.eventInfoLabel}>Time</Text>
                  <Text style={styles.eventInfoValue}>{listing.eventTime}</Text>
                </View>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Select Tickets</Text>
            <View style={styles.pointsHint}>
              <Ionicons name="sparkles" size={15} color={colors.primary} />
              <Text style={styles.pointsHintText}>Earn {listing.pointsEarned} Spotly Points with this purchase</Text>
            </View>

            {listing.ticketTiers.map(tier => (
              <Pressable
                key={tier.id}
                onPress={() => setSelectedTier(tier)}
                style={[styles.tierCard, selectedTier?.id === tier.id && styles.tierCardActive]}
              >
                <View style={[styles.tierColorBar, { backgroundColor: tier.color }]} />
                <View style={styles.tierInfo}>
                  <Text style={styles.tierName}>{tier.name}</Text>
                  <Text style={styles.tierDesc}>{tier.description}</Text>
                </View>
                <View style={styles.tierRight}>
                  <Text style={styles.tierPrice}>${tier.price}</Text>
                  <Text style={styles.tierPriceSub}>per ticket</Text>
                </View>
                <View style={[styles.radio, selectedTier?.id === tier.id && styles.radioActive]}>
                  {selectedTier?.id === tier.id && <View style={styles.radioDot} />}
                </View>
              </Pressable>
            ))}

            <Text style={styles.sectionTitle}>Number of Tickets</Text>
            <View style={styles.qtyRow}>
              <Pressable onPress={() => setTicketQty(q => Math.max(1, q - 1))} style={styles.qtyBtn}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.qtyNum}>{ticketQty}</Text>
              <Pressable onPress={() => setTicketQty(q => Math.min(10, q + 1))} style={[styles.qtyBtn, styles.qtyBtnFill]}>
                <Ionicons name="add" size={18} color={colors.white} />
              </Pressable>
              <Text style={styles.qtyTotal}>
                = <Text style={{ fontWeight: '800', color: colors.primary }}>${((selectedTier?.price ?? 0) * ticketQty).toFixed(2)}</Text> total
              </Text>
            </View>
          </View>
        )}

        {/* ── RESTAURANTS: Booking widget ── */}
        {isBookable && !isMenu && (
          <View style={styles.bookSection}>
            <Text style={styles.sectionTitle}>Make a Reservation</Text>
            <View style={styles.pointsHint}>
              <Ionicons name="sparkles" size={15} color={colors.primary} />
              <Text style={styles.pointsHintText}>Earn {listing.pointsEarned} Spotly Points with this booking</Text>
            </View>

            <View style={styles.partySizeRow}>
              <Text style={styles.fieldLabel}>Party size</Text>
              <View style={styles.stepper}>
                <Pressable onPress={() => setPartySize(p => Math.max(1, p - 1))} style={styles.stepBtn}>
                  <Ionicons name="remove" size={18} color={colors.textPrimary} />
                </Pressable>
                <Text style={styles.stepValue}>{partySize}</Text>
                <Pressable onPress={() => setPartySize(p => Math.min(20, p + 1))} style={[styles.stepBtn, styles.stepBtnActive]}>
                  <Ionicons name="add" size={18} color={colors.white} />
                </Pressable>
              </View>
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {DATES.map(d => (
                <Pressable key={d} onPress={() => { setSelectedDate(d); setSelectedSlot(null) }} style={[styles.dateChip, selectedDate === d && styles.dateChipActive]}>
                  <Text style={[styles.dateChipText, selectedDate === d && styles.dateChipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Available times</Text>
            <View style={styles.slotsGrid}>
              {(listing.timeSlots ?? []).map(slot => (
                <Pressable key={slot} onPress={() => setSelectedSlot(slot)} style={[styles.slotBtn, selectedSlot === slot && styles.slotBtnActive]}>
                  <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextActive]}>{slot}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ── FOOD/GROCERIES: Menu ── */}
        {isMenu && (
          <View style={styles.menuSection}>
            <Text style={styles.sectionTitle}>{listing.category === 'groceries' ? 'Available Items' : 'Menu Highlights'}</Text>
            {listing.menu?.map(item => (
              <View key={item.id} style={styles.menuItem}>
                <Image source={{ uri: item.image }} style={styles.menuImg} />
                <View style={styles.menuInfo}>
                  <Text style={styles.menuName}>{item.name}</Text>
                  <Text style={styles.menuDesc}>{item.desc}</Text>
                  <Text style={styles.menuPrice}>${item.price.toFixed(2)}</Text>
                </View>
                <View style={styles.qtyControl}>
                  {getCartQtyForItem(item.id) > 0 && (
                    <>
                      <Pressable onPress={() => cartUpdateQty(item.id, -1)} style={styles.menuQtyBtn}>
                        <Ionicons name="remove" size={14} color={colors.textPrimary} />
                      </Pressable>
                      <Text style={styles.menuQtyNum}>{getCartQtyForItem(item.id)}</Text>
                    </>
                  )}
                  <Pressable onPress={() => addItem({ id: item.id, name: item.name, price: item.price, image: item.image, from: listing.name, itemType: 'food' })} style={[styles.menuQtyBtn, styles.menuQtyBtnAdd]}>
                    <Ionicons name="add" size={14} color={colors.white} />
                  </Pressable>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.divider} />

        {/* Reviews */}
        <View style={styles.reviewSection}>
          <View style={styles.reviewHeader}>
            <Text style={styles.sectionTitle}>Reviews</Text>
            <View style={styles.ratingBadge}>
              <Ionicons name="star" size={13} color={colors.amber} />
              <Text style={styles.ratingBadgeText}>{listing.rating} ({listing.reviewCount})</Text>
            </View>
          </View>
          {listingReviews.length > 0 ? listingReviews.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Image source={{ uri: r.avatar }} style={styles.reviewAvatar} />
                <View>
                  <View style={styles.reviewNameRow}>
                    <Text style={styles.reviewUser}>{r.user}</Text>
                    {r.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>}
                  </View>
                  <View style={styles.reviewStars}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Ionicons key={i} name="star" size={11} color={i < r.rating ? colors.amber : colors.border} />
                    ))}
                    <Text style={styles.reviewDate}> · {r.date}</Text>
                  </View>
                </View>
              </View>
              <Text style={styles.reviewText}>{r.text}</Text>
            </View>
          )) : (
            <View style={styles.noReviews}>
              <Text style={styles.noReviewsText}>No reviews yet. Be the first!</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* CTA */}
      <View style={[styles.cta, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        {isEvent ? (
          addedToCart ? (
            <Pressable style={styles.ctaBtn} onPress={() => (nav as any).navigate('MainTabs', { screen: 'Cart' })}>
              <Ionicons name="cart-outline" size={18} color={colors.white} />
              <Text style={styles.ctaBtnText}>View Cart · {totalCartItemsForListing} ticket{totalCartItemsForListing !== 1 ? 's' : ''}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={handleAddTicketsToCart} style={[styles.ctaBtn, !selectedTier && styles.ctaBtnDisabled]}>
              <Ionicons name="ticket-outline" size={18} color={colors.white} />
              <Text style={styles.ctaBtnText}>
                Add {ticketQty} Ticket{ticketQty !== 1 ? 's' : ''} to Cart · ${((selectedTier?.price ?? 0) * ticketQty).toFixed(2)}
              </Text>
            </Pressable>
          )
        ) : isBookable ? (
          <Pressable
            onPress={() => selectedSlot && nav.navigate('Booking', { listing, slot: selectedSlot, partySize, date: selectedDate })}
            style={[styles.ctaBtn, !selectedSlot && styles.ctaBtnDisabled]}
          >
            <Ionicons name="calendar-clear-outline" size={18} color={selectedSlot ? colors.white : colors.textMuted} />
            <Text style={[styles.ctaBtnText, !selectedSlot && styles.ctaBtnTextDisabled]}>
              {selectedSlot ? `Reserve for ${selectedSlot}` : 'Select a time to reserve'}
            </Text>
          </Pressable>
        ) : (
          <Pressable style={styles.ctaBtn} onPress={() => (nav as any).navigate('MainTabs', { screen: 'Cart' })}>
            <Ionicons name="cart-outline" size={18} color={colors.white} />
            <Text style={styles.ctaBtnText}>
              {totalCartItemsForListing > 0 ? `View Cart (${totalCartItemsForListing} item${totalCartItemsForListing !== 1 ? 's' : ''})` : 'Order Now'}
            </Text>
          </Pressable>
        )}
      </View>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hero: { height: 240, position: 'relative' },
  heroImg: { width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.2)' },
  heroBar: { position: 'absolute', top: 0, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md },
  heroBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  heroActions: { flexDirection: 'row', gap: 8 },
  eventDateBadge: { position: 'absolute', bottom: 12, left: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primary, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  eventDateText: { fontSize: 12, fontWeight: '700', color: colors.white },
  scroll: { flex: 1 },
  infoSection: { padding: spacing.md },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  name: { flex: 1, fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginRight: 8, letterSpacing: -0.3 },
  price: { fontSize: 14, color: colors.textMuted, fontWeight: '500', marginTop: 2 },
  cuisine: { fontSize: 14, color: colors.textMuted, marginTop: 4, marginBottom: 10 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, flexWrap: 'wrap' },
  rating: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  reviewCount: { fontSize: 13, color: colors.textMuted },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textLight },
  metaText: { fontSize: 13, color: colors.textMuted },
  tag: { backgroundColor: colors.primaryPale, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20 },
  tagText: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  desc: { fontSize: 14, color: colors.textMuted, lineHeight: 22, marginTop: 14 },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12 },
  address: { fontSize: 13, color: colors.textMuted, flex: 1 },
  mapPlaceholder: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, height: 80, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, marginTop: 12 },
  mapText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  divider: { height: 8, backgroundColor: colors.divider },

  // Event
  eventSection: { padding: spacing.md },
  eventInfoRow: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14, marginBottom: 20 },
  eventInfoItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  eventInfoDivider: { width: 1, backgroundColor: colors.border, marginHorizontal: 8 },
  eventInfoLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  eventInfoValue: { fontSize: 13, fontWeight: '700', color: colors.textPrimary, marginTop: 1 },
  tierCard: { flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, marginBottom: 10, overflow: 'hidden' },
  tierCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  tierColorBar: { width: 5, alignSelf: 'stretch' },
  tierInfo: { flex: 1, padding: 12 },
  tierName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  tierDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  tierRight: { alignItems: 'flex-end', paddingRight: 8 },
  tierPrice: { fontSize: 18, fontWeight: '800', color: colors.primary },
  tierPriceSub: { fontSize: 10, color: colors.textMuted },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  qtyRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 8 },
  qtyBtn: { width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  qtyBtnFill: { backgroundColor: colors.primary, borderColor: colors.primary },
  qtyNum: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, minWidth: 28, textAlign: 'center' },
  qtyTotal: { fontSize: 14, color: colors.textMuted, fontWeight: '500' },

  // Booking
  bookSection: { padding: spacing.md },
  menuSection: { padding: spacing.md },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary, marginBottom: 14 },
  pointsHint: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.primaryPale, borderRadius: radius.md, padding: 10, marginBottom: 16 },
  pointsHintText: { fontSize: 13, color: colors.primary, fontWeight: '600' },
  partySizeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepBtn: { width: 32, height: 32, borderRadius: 16, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepValue: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, minWidth: 24, textAlign: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  dateChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  dateChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dateChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  dateChipTextActive: { color: colors.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.primaryPale },
  slotBtnActive: { backgroundColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  slotTextActive: { color: colors.white },
  menuItem: { flexDirection: 'row', gap: 12, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 10, marginBottom: 10 },
  menuImg: { width: 60, height: 60, borderRadius: radius.md },
  menuInfo: { flex: 1 },
  menuName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  menuDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  menuPrice: { fontSize: 14, fontWeight: '700', color: colors.primary, marginTop: 4 },
  qtyControl: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  menuQtyBtn: { width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  menuQtyBtnAdd: { backgroundColor: colors.primary, borderColor: colors.primary },
  menuQtyNum: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, minWidth: 16, textAlign: 'center' },
  reviewSection: { padding: spacing.md },
  reviewHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  ratingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  ratingBadgeText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  reviewCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  reviewTop: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  reviewAvatar: { width: 36, height: 36, borderRadius: 18 },
  reviewNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewUser: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  verifiedBadge: { backgroundColor: colors.primaryPale, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  reviewStars: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  reviewDate: { fontSize: 11, color: colors.textMuted },
  reviewText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  noReviews: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 20, alignItems: 'center' },
  noReviewsText: { fontSize: 14, color: colors.textMuted },
  cta: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: spacing.md, paddingVertical: 16 },
  ctaBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  ctaBtnDisabled: { backgroundColor: colors.surfaceAlt },
  ctaBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  ctaBtnTextDisabled: { color: colors.textMuted },
})
