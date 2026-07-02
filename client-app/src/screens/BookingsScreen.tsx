import React, { useState } from 'react'
import {
  View, Text, ScrollView, Pressable, Image, StyleSheet,
  Modal, TextInput, KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { Booking, listings } from '../data/mock'
import { RootStackParamList } from '../navigation'
import { useBookings } from '../context/BookingsContext'
import { useReviews } from '../context/ReviewsContext'
import { useNotifications } from '../context/NotificationsContext'

type Nav = NativeStackNavigationProp<RootStackParamList>

const DATES = ['Tonight', 'Tomorrow', 'Sat Jun 28', 'Sun Jun 29', 'Mon Jun 30', 'Tue Jul 1']
const SLOTS = ['12:00 PM', '12:30 PM', '1:00 PM', '6:00 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM']

function QRCode({ value, size = 90 }: { value: string; size?: number }) {
  const cells = 11
  const cell = size / cells
  const hash = value.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
  return (
    <View style={{ width: size, height: size, flexDirection: 'row', flexWrap: 'wrap', backgroundColor: '#fff', borderRadius: 4, overflow: 'hidden' }}>
      {Array.from({ length: cells * cells }).map((_, i) => {
        const row = Math.floor(i / cells)
        const col = i % cells
        const corner = (row < 3 && col < 3) || (row < 3 && col >= cells - 3) || (row >= cells - 3 && col < 3)
        const filled = corner || ((hash * (i + 1) * 31) % 7 < 3)
        return <View key={i} style={{ width: cell, height: cell, backgroundColor: filled ? '#000' : '#fff' }} />
      })}
    </View>
  )
}

export default function BookingsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming')

  // Shared booking state so reservations made anywhere in the app show up here
  const { upcoming, past, cancelBooking, modifyBooking, markReviewed } = useBookings()
  const { addReview } = useReviews()
  const { addNotification } = useNotifications()

  const bookings = tab === 'upcoming' ? upcoming : past

  // Modal targets
  const [cancelTarget, setCancelTarget] = useState<Booking | null>(null)
  const [detailTarget, setDetailTarget] = useState<Booking | null>(null)
  const [modifyTarget, setModifyTarget] = useState<Booking | null>(null)
  const [reviewTarget, setReviewTarget] = useState<Booking | null>(null)

  // Modify state
  const [modDate, setModDate] = useState('')
  const [modTime, setModTime] = useState('')
  const [modParty, setModParty] = useState(2)

  // Review state
  const [reviewStars, setReviewStars] = useState(5)
  const [reviewText, setReviewText] = useState('')
  const [reviewSubmitted, setReviewSubmitted] = useState(false)

  const openModify = (b: Booking) => {
    setModDate(b.date)
    setModTime(b.time)
    setModParty(b.partySize)
    setModifyTarget(b)
  }

  const confirmModify = () => {
    if (!modifyTarget) return
    modifyBooking(modifyTarget.id, { date: modDate, time: modTime, partySize: modParty })
    addNotification({
      type: 'booking',
      title: 'Booking updated',
      body: `${modifyTarget.listingName} is now ${modDate} at ${modTime} for ${modParty} guest${modParty !== 1 ? 's' : ''}.`,
    })
    setModifyTarget(null)
  }

  const confirmCancel = () => {
    if (!cancelTarget) return
    cancelBooking(cancelTarget.id)
    addNotification({
      type: 'booking',
      title: 'Reservation cancelled',
      body: `Your booking at ${cancelTarget.listingName} (${cancelTarget.date}) has been cancelled.`,
    })
    setCancelTarget(null)
  }

  const submitReview = () => {
    if (!reviewTarget) return
    markReviewed(reviewTarget.id)
    addReview({ listingId: reviewTarget.listingId, rating: reviewStars, text: reviewText.trim() })
    addNotification({
      type: 'review',
      title: 'Review posted',
      body: `Thanks for reviewing ${reviewTarget.listingName}. You earned +25 Spotly Points!`,
    })
    setReviewSubmitted(true)
    setTimeout(() => {
      setReviewTarget(null)
      setReviewSubmitted(false)
      setReviewStars(5)
      setReviewText('')
    }, 1600)
  }

  const handleRebook = (b: Booking) => {
    const listing = listings.find(l => l.id === b.listingId)
    if (listing) nav.navigate('Detail', { listing })
  }

  return (
    <View style={styles.safe}>
      <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <Text style={styles.title}>Bookings</Text>
          <Text style={styles.subtitle}>Your reservations, tickets & orders</Text>
          <View style={styles.toggle}>
            {(['upcoming', 'past'] as const).map(t => (
              <Pressable key={t} onPress={() => setTab(t)} style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}>
                <Text style={[styles.toggleText, tab === t && styles.toggleTextActive]}>
                  {t.charAt(0).toUpperCase() + t.slice(1)} ({t === 'upcoming' ? upcoming.length : past.length})
                </Text>
              </Pressable>
            ))}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]} showsVerticalScrollIndicator={false}>
        {bookings.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="calendar-outline" size={48} color={colors.textLight} />
            <Text style={styles.emptyTitle}>No {tab} bookings</Text>
            <Text style={styles.emptySub}>Explore venues to make your first booking</Text>
          </View>
        ) : bookings.map(b => (
          <View key={b.id} style={styles.card}>
            <View style={styles.cardImage}>
              <Image source={{ uri: b.listingImage }} style={styles.image} />
              <View style={styles.imageOverlay} />
              <View style={styles.imageBottom}>
                <Text style={styles.listingName}>{b.listingName}</Text>
                <View style={[styles.statusBadge, b.status === 'confirmed' ? styles.statusConfirmed : styles.statusCompleted]}>
                  <Text style={[styles.statusText, b.status === 'confirmed' ? styles.statusTextConfirmed : styles.statusTextCompleted]}>
                    {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.cardBody}>
              <View style={styles.metaRow}>
                {[
                  { icon: 'calendar-outline' as const, val: b.date },
                  { icon: 'time-outline' as const, val: b.time },
                  { icon: 'people-outline' as const, val: `${b.partySize} guest${b.partySize !== 1 ? 's' : ''}` },
                ].map(({ icon, val }) => (
                  <View key={icon} style={styles.metaItem}>
                    <Ionicons name={icon} size={12} color={colors.primary} />
                    <Text style={styles.metaText}>{val}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.codeRow}>
                <View style={styles.codeBadge}>
                  <Text style={styles.codeText}>{b.confirmationCode}</Text>
                </View>
                <Text style={styles.pointsText}>+{b.points} pts</Text>
              </View>

              {tab === 'upcoming' ? (
                <View style={styles.actions}>
                  <Pressable style={[styles.actionBtn, styles.actionModify]} onPress={() => openModify(b)}>
                    <Ionicons name="create-outline" size={13} color={colors.primary} />
                    <Text style={styles.actionModifyText}>Modify</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.actionPrimary]} onPress={() => setDetailTarget(b)}>
                    <Ionicons name="document-text-outline" size={13} color={colors.white} />
                    <Text style={styles.actionPrimaryText}>Details</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.actionCancel]} onPress={() => setCancelTarget(b)}>
                    <Ionicons name="close-circle-outline" size={13} color={colors.red} />
                    <Text style={styles.actionCancelText}>Cancel</Text>
                  </Pressable>
                </View>
              ) : (
                <View style={styles.actions}>
                  {b.canReview
                    ? <Pressable style={[styles.actionBtn, styles.actionPrimary, { flex: 1 }]} onPress={() => setReviewTarget(b)}>
                        <Ionicons name="star-outline" size={13} color={colors.white} />
                        <Text style={styles.actionPrimaryText}>Leave a Review</Text>
                      </Pressable>
                    : <Pressable style={[styles.actionBtn, styles.actionModify, { flex: 1 }]}>
                        <Ionicons name="checkmark" size={13} color={colors.primary} />
                        <Text style={styles.actionModifyText}> Reviewed</Text>
                      </Pressable>
                  }
                  <Pressable style={[styles.actionBtn, styles.actionModify, { flex: 1 }]} onPress={() => handleRebook(b)}>
                    <Ionicons name="refresh-outline" size={13} color={colors.primary} />
                    <Text style={styles.actionModifyText}> Rebook</Text>
                  </Pressable>
                  <Pressable style={[styles.actionBtn, styles.actionSecondary]} onPress={() => setDetailTarget(b)}>
                    <Ionicons name="document-text-outline" size={13} color={colors.textMuted} />
                    <Text style={styles.actionSecondaryText}>Details</Text>
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* ── DETAILS MODAL ── */}
      <Modal visible={!!detailTarget} transparent animationType="slide" onRequestClose={() => setDetailTarget(null)}>
        <Pressable style={styles.overlay} onPress={() => setDetailTarget(null)} />
        {detailTarget && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Booking Details</Text>

            <LinearGradient colors={['#0D1B2A', '#0D2A1B']} style={styles.detailCard}>
              <View style={styles.detailTop}>
                <View style={styles.detailInfo}>
                  <Text style={styles.detailName}>{detailTarget.listingName}</Text>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeText}>{detailTarget.status.toUpperCase()}</Text>
                  </View>
                </View>
                <QRCode value={detailTarget.confirmationCode} size={80} />
              </View>

              <View style={styles.detailDivider} />

              <View style={styles.detailGrid}>
                {[
                  { label: 'Date', value: detailTarget.date },
                  { label: 'Time', value: detailTarget.time },
                  { label: 'Guests', value: `${detailTarget.partySize}` },
                  { label: 'Points', value: `+${detailTarget.points}` },
                ].map(({ label, value }) => (
                  <View key={label} style={styles.detailCell}>
                    <Text style={styles.detailCellLabel}>{label}</Text>
                    <Text style={styles.detailCellValue}>{value}</Text>
                  </View>
                ))}
              </View>

              <View style={styles.detailDivider} />

              <Text style={styles.detailCodeLabel}>Confirmation Code</Text>
              <Text style={styles.detailCode}>{detailTarget.confirmationCode}</Text>
            </LinearGradient>

            <Pressable style={styles.sheetPrimaryBtn} onPress={() => setDetailTarget(null)}>
              <Text style={styles.sheetPrimaryBtnText}>Done</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* ── MODIFY MODAL ── */}
      <Modal visible={!!modifyTarget} transparent animationType="slide" onRequestClose={() => setModifyTarget(null)}>
        <Pressable style={styles.overlay} onPress={() => setModifyTarget(null)} />
        {modifyTarget && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Modify Booking</Text>
            <Text style={styles.sheetSub}>{modifyTarget.listingName}</Text>

            <Text style={styles.fieldLabel}>Party size</Text>
            <View style={styles.stepperRow}>
              <Pressable onPress={() => setModParty(p => Math.max(1, p - 1))} style={styles.stepBtn}>
                <Ionicons name="remove" size={18} color={colors.textPrimary} />
              </Pressable>
              <Text style={styles.stepValue}>{modParty}</Text>
              <Pressable onPress={() => setModParty(p => Math.min(20, p + 1))} style={[styles.stepBtn, styles.stepBtnActive]}>
                <Ionicons name="add" size={18} color={colors.white} />
              </Pressable>
              <Text style={styles.guestLabel}>{modParty === 1 ? 'guest' : 'guests'}</Text>
            </View>

            <Text style={styles.fieldLabel}>Date</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }} contentContainerStyle={{ gap: 8 }}>
              {DATES.map(d => (
                <Pressable key={d} onPress={() => setModDate(d)} style={[styles.chip, modDate === d && styles.chipActive]}>
                  <Text style={[styles.chipText, modDate === d && styles.chipTextActive]}>{d}</Text>
                </Pressable>
              ))}
            </ScrollView>

            <Text style={styles.fieldLabel}>Time</Text>
            <View style={styles.slotsGrid}>
              {SLOTS.map(s => (
                <Pressable key={s} onPress={() => setModTime(s)} style={[styles.slotBtn, modTime === s && styles.slotBtnActive]}>
                  <Text style={[styles.slotText, modTime === s && styles.slotTextActive]}>{s}</Text>
                </Pressable>
              ))}
            </View>

            <Pressable style={styles.sheetPrimaryBtn} onPress={confirmModify}>
              <Text style={styles.sheetPrimaryBtnText}>Save Changes</Text>
            </Pressable>
            <Pressable style={styles.sheetSecondaryBtn} onPress={() => setModifyTarget(null)}>
              <Text style={styles.sheetSecondaryBtnText}>Keep Original</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* ── CANCEL MODAL ── */}
      <Modal visible={!!cancelTarget} transparent animationType="slide" onRequestClose={() => setCancelTarget(null)}>
        <Pressable style={styles.overlay} onPress={() => setCancelTarget(null)} />
        {cancelTarget && (
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
            <View style={styles.handle} />
            <View style={styles.cancelIconWrap}>
              <Ionicons name="alert-circle-outline" size={40} color={colors.red} />
            </View>
            <Text style={styles.sheetTitle}>Cancel Reservation?</Text>
            <Text style={styles.sheetSub}>
              {cancelTarget.listingName} · {cancelTarget.date} at {cancelTarget.time}
            </Text>
            <Text style={styles.cancelPolicy}>
              Cancellations made more than 2 hours before your reservation are free. Late cancellations may incur a fee.
            </Text>
            <Pressable style={styles.cancelConfirm} onPress={confirmCancel}>
              <Text style={styles.cancelConfirmText}>Yes, Cancel Reservation</Text>
            </Pressable>
            <Pressable style={styles.sheetSecondaryBtn} onPress={() => setCancelTarget(null)}>
              <Text style={styles.sheetSecondaryBtnText}>Keep Reservation</Text>
            </Pressable>
          </View>
        )}
      </Modal>

      {/* ── REVIEW MODAL ── */}
      <Modal visible={!!reviewTarget} transparent animationType="slide" onRequestClose={() => setReviewTarget(null)}>
        <Pressable style={styles.overlay} onPress={() => setReviewTarget(null)} />
        {reviewTarget && (
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
            <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
              <View style={styles.handle} />

              {reviewSubmitted ? (
                <View style={styles.reviewSuccess}>
                  <View style={styles.reviewSuccessIcon}>
                    <Ionicons name="checkmark" size={32} color={colors.white} />
                  </View>
                  <Text style={styles.reviewSuccessTitle}>Review Submitted!</Text>
                  <Text style={styles.reviewSuccessSub}>Thank you for your feedback</Text>
                </View>
              ) : (
                <>
                  <Text style={styles.sheetTitle}>Leave a Review</Text>
                  <Text style={styles.sheetSub}>{reviewTarget.listingName}</Text>

                  <View style={styles.starsRow}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Pressable key={s} onPress={() => setReviewStars(s)} hitSlop={8}>
                        <Ionicons
                          name={s <= reviewStars ? 'star' : 'star-outline'}
                          size={36}
                          color={s <= reviewStars ? colors.amber : colors.border}
                        />
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.starLabel}>
                    {['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent!'][reviewStars]}
                  </Text>

                  <TextInput
                    value={reviewText}
                    onChangeText={setReviewText}
                    placeholder="Share your experience…"
                    placeholderTextColor={colors.textLight}
                    multiline
                    numberOfLines={4}
                    style={styles.reviewInput}
                    textAlignVertical="top"
                  />

                  <Pressable
                    style={[styles.sheetPrimaryBtn, !reviewText.trim() && { opacity: 0.5 }]}
                    onPress={submitReview}
                    disabled={!reviewText.trim()}
                  >
                    <Text style={styles.sheetPrimaryBtnText}>Submit Review</Text>
                  </Pressable>
                  <Pressable style={styles.sheetSecondaryBtn} onPress={() => setReviewTarget(null)}>
                    <Text style={styles.sheetSecondaryBtnText}>Cancel</Text>
                  </Pressable>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        )}
      </Modal>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingBottom: spacing.md, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  title: { fontSize: 26, fontWeight: '800', color: colors.white, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.85)', marginTop: 2, marginBottom: 16 },
  toggle: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.lg, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.9)' },
  toggleTextActive: { color: colors.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center' },

  card: { backgroundColor: colors.surface, borderRadius: radius.xl, overflow: 'hidden', borderWidth: 1, borderColor: colors.border, marginBottom: 14, ...shadow.sm },
  cardImage: { height: 120, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  imageBottom: { position: 'absolute', bottom: 10, left: 12, right: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  listingName: { color: colors.white, fontSize: 16, fontWeight: '700', flex: 1, marginRight: 8 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusConfirmed: { backgroundColor: colors.primaryPale },
  statusCompleted: { backgroundColor: 'rgba(255,255,255,0.2)' },
  statusText: { fontSize: 11, fontWeight: '700' },
  statusTextConfirmed: { color: colors.primary },
  statusTextCompleted: { color: colors.white },
  cardBody: { padding: 12 },
  metaRow: { flexDirection: 'row', gap: 12, marginBottom: 10, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 12, color: colors.textMuted },
  codeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  codeBadge: { backgroundColor: '#0D1B2A', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  codeText: { color: '#34D399', fontSize: 12, fontWeight: '800', letterSpacing: 2 },
  pointsText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { paddingVertical: 9, paddingHorizontal: 10, borderRadius: radius.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4 },
  actionModify: { backgroundColor: colors.primaryPale, flex: 1 },
  actionModifyText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  actionCancel: { backgroundColor: colors.redLight, flex: 1 },
  actionCancelText: { fontSize: 12, fontWeight: '700', color: colors.red },
  actionPrimary: { backgroundColor: colors.primary, flex: 1 },
  actionPrimaryText: { fontSize: 12, fontWeight: '700', color: colors.white },
  actionSecondary: { backgroundColor: colors.surfaceAlt, flex: 1, borderWidth: 1, borderColor: colors.border },
  actionSecondaryText: { fontSize: 12, fontWeight: '700', color: colors.textMuted },

  // Shared sheet
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 4, textAlign: 'center' },
  sheetSub: { fontSize: 13, color: colors.textMuted, textAlign: 'center', marginBottom: 20 },
  sheetPrimaryBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  sheetPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  sheetSecondaryBtn: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  sheetSecondaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },

  // Details
  detailCard: { borderRadius: radius.xl, padding: spacing.md, marginBottom: 16, overflow: 'hidden' },
  detailTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  detailInfo: { flex: 1, paddingRight: 12 },
  detailName: { fontSize: 17, fontWeight: '800', color: colors.white, marginBottom: 8, lineHeight: 22 },
  detailBadge: { backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start' },
  detailBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.7)', letterSpacing: 1 },
  detailDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)', marginVertical: 12 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  detailCell: { width: '45%' },
  detailCellLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 2 },
  detailCellValue: { fontSize: 14, fontWeight: '700', color: colors.white },
  detailCodeLabel: { fontSize: 11, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginBottom: 4 },
  detailCode: { fontSize: 22, fontWeight: '800', color: '#34D399', textAlign: 'center', letterSpacing: 3 },

  // Modify
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10 },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  stepValue: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, minWidth: 28, textAlign: 'center' },
  guestLabel: { fontSize: 14, color: colors.textMuted },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: colors.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  slotBtn: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.md, backgroundColor: colors.primaryPale },
  slotBtnActive: { backgroundColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  slotTextActive: { color: colors.white },

  // Cancel
  cancelIconWrap: { alignItems: 'center', marginBottom: 12 },
  cancelPolicy: { fontSize: 13, color: colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  cancelConfirm: { backgroundColor: colors.red, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  cancelConfirmText: { color: colors.white, fontWeight: '700', fontSize: 15 },

  // Review
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 8 },
  starLabel: { fontSize: 15, fontWeight: '700', color: colors.amber, textAlign: 'center', marginBottom: 16, minHeight: 20 },
  reviewInput: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 100, marginBottom: 20 },
  reviewSuccess: { alignItems: 'center', paddingVertical: 24 },
  reviewSuccessIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  reviewSuccessTitle: { fontSize: 20, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  reviewSuccessSub: { fontSize: 14, color: colors.textMuted },
})
