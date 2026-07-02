import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { useBookings } from '../context/BookingsContext'
import { useNotifications } from '../context/NotificationsContext'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'Booking'>

const STEPS = ['Select', 'Confirm', 'Done']

export default function BookingScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const bar = makeBar(colors)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<Nav>()
  const { listing, slot, partySize: initParty = 2, date: initDate = 'Tonight' } = useRoute<Route>().params
  const [step, setStep] = useState(slot ? 1 : 0)
  const [party, setParty] = useState(initParty)
  const [date, setDate] = useState(initDate)
  const [time, setTime] = useState(slot ?? null)
  const [notes, setNotes] = useState('')
  const [code, setCode] = useState('')
  const { addBooking } = useBookings()
  const { addNotification } = useNotifications()
  const isExperience = listing.category === 'experiences'

  const handleConfirm = () => {
    const booking = addBooking({
      listingId: listing.id,
      listingName: listing.name,
      listingImage: listing.image,
      date,
      time: time!,
      partySize: party,
      points: listing.pointsEarned,
      type: listing.type,
    })
    setCode(booking.confirmationCode)
    addNotification({
      type: 'booking',
      title: `${isExperience ? 'Booking' : 'Reservation'} confirmed`,
      body: `${listing.name} · ${date} at ${time}. Ref ${booking.confirmationCode}.`,
    })
    setStep(2)
  }

  // Step 0 — select
  if (step === 0) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Reserve a Table</Text>
        <View style={{ width: 36 }} />
      </View>
      <StepBar step={step} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <Text style={styles.label}>Party size</Text>
        <View style={styles.partySizeRow}>
          <Pressable onPress={() => setParty(p => Math.max(1, p - 1))} style={styles.stepBtn}>
            <Ionicons name="remove" size={18} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.partyNum}>{party}</Text>
          <Pressable onPress={() => setParty(p => Math.min(20, p + 1))} style={[styles.stepBtn, styles.stepBtnFill]}>
            <Ionicons name="add" size={18} color={colors.white} />
          </Pressable>
          <Text style={styles.guestsLabel}>{party === 1 ? 'guest' : 'guests'}</Text>
        </View>

        <Text style={styles.label}>Date</Text>
        <View style={styles.chipWrap}>
          {['Tonight', 'Tomorrow', 'Sat Jun 28', 'Sun Jun 29'].map(d => (
            <Pressable key={d} onPress={() => { setDate(d); setTime(null) }} style={[styles.chip, date === d && styles.chipActive]}>
              <Text style={[styles.chipText, date === d && styles.chipTextActive]}>{d}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Available times</Text>
        <View style={styles.slotsGrid}>
          {(listing.timeSlots ?? []).map(s => (
            <Pressable key={s} onPress={() => setTime(s)} style={[styles.slotBtn, time === s && styles.slotBtnActive]}>
              <Text style={[styles.slotText, time === s && styles.slotTextActive]}>{s}</Text>
            </Pressable>
          ))}
        </View>

        <Text style={styles.label}>Special requests (optional)</Text>
        <TextInput
          value={notes}
          onChangeText={setNotes}
          placeholder="Dietary requirements, celebrations…"
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />
      </ScrollView>
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable onPress={() => time && setStep(1)} style={[styles.cta, !time && styles.ctaDisabled]}>
          <Text style={[styles.ctaText, !time && styles.ctaTextDisabled]}>
            {time ? 'Continue' : 'Select a time to continue'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )

  // Step 1 — confirm
  if (step === 1) return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => setStep(0)} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Confirm Booking</Text>
        <View style={{ width: 36 }} />
      </View>
      <StepBar step={step} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        <View style={styles.confirmCard}>
          {[
            { icon: 'people-outline' as const, label: 'Party size', value: `${party} guest${party !== 1 ? 's' : ''}` },
            { icon: 'calendar-outline' as const, label: 'Date', value: date },
            { icon: 'time-outline' as const, label: 'Time', value: time! },
          ].map(({ icon, label, value }) => (
            <View key={label} style={styles.confirmRow}>
              <View style={styles.confirmLeft}>
                <Ionicons name={icon} size={16} color={colors.primary} />
                <Text style={styles.confirmLabel}>{label}</Text>
              </View>
              <Text style={styles.confirmValue}>{value}</Text>
            </View>
          ))}
        </View>

        {notes ? (
          <View style={styles.notesCard}>
            <Text style={styles.notesLabel}>Special requests</Text>
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        ) : null}

        <View style={styles.pointsCard}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <View>
            <Text style={styles.pointsTitle}>+{listing.pointsEarned} Spotly Points</Text>
            <Text style={styles.pointsSub}>Credited after your visit is complete</Text>
          </View>
        </View>

        <Text style={styles.terms}>
          By confirming, you agree to Spotly's booking terms. Free cancellation up to 2 hours before your reservation.
        </Text>
      </ScrollView>
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable onPress={handleConfirm} style={styles.cta}>
          <Text style={styles.ctaText}>{isExperience ? 'Confirm Booking' : 'Confirm Reservation'}</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )

  // Step 2 — confirmed
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={[styles.content, { alignItems: 'center', paddingTop: 40 }]}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={36} color={colors.white} />
        </View>
        <Text style={styles.successTitle}>You're booked!</Text>
        <Text style={styles.successSub}>Your reservation at {listing.name} is confirmed</Text>

        <LinearGradient colors={['#0D1B2A', '#1a3a28']} style={styles.ticketCard}>
          <View style={styles.ticketTop}>
            <Text style={styles.ticketName}>{listing.name}</Text>
            <Text style={styles.ticketCuisine}>{listing.cuisine}</Text>
          </View>
          <View style={styles.ticketDivider} />
          <View style={styles.ticketGrid}>
            {[['Date', date], ['Time', time!], ['Guests', `${party}`], ['Points', `+${listing.pointsEarned}`]].map(([l, v]) => (
              <View key={l} style={styles.ticketCell}>
                <Text style={styles.ticketLabel}>{l}</Text>
                <Text style={styles.ticketValue}>{v}</Text>
              </View>
            ))}
          </View>
          <View style={styles.ticketDivider} />
          <Text style={styles.codeLabel}>Confirmation code</Text>
          <Text style={styles.code}>{code}</Text>
        </LinearGradient>

        <View style={styles.pointsCard}>
          <Ionicons name="sparkles" size={18} color={colors.primary} />
          <Text style={styles.pointsTitle}>+{listing.pointsEarned} points added to your balance</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="download-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionBtnText}>Save Pass</Text>
          </Pressable>
          <Pressable style={styles.actionBtn}>
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </Pressable>
        </View>
      </ScrollView>
      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable onPress={() => nav.popToTop()} style={styles.cta}>
          <Text style={styles.ctaText}>Back to Home</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

function StepBar({ step }: { step: number }) {
  const { colors } = useTheme()
  const bar = makeBar(colors)
  return (
    <View style={bar.wrap}>
      {STEPS.map((s, i) => (
        <React.Fragment key={s}>
          <View style={[bar.circle, i <= step && bar.circleActive]}>
            {i < step
              ? <Ionicons name="checkmark" size={14} color={colors.white} />
              : <Text style={[bar.num, i === step && bar.numActive]}>{i + 1}</Text>}
          </View>
          {i < STEPS.length - 1 && <View style={[bar.line, i < step && bar.lineActive]} />}
        </React.Fragment>
      ))}
    </View>
  )
}

const makeBar = (colors: Palette) => StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  circle: { width: 28, height: 28, borderRadius: 14, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  circleActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  num: { fontSize: 12, fontWeight: '700', color: colors.textMuted },
  numActive: { color: colors.white },
  line: { flex: 1, height: 2, backgroundColor: colors.border },
  lineActive: { backgroundColor: colors.primary },
})

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingTop: spacing.sm, paddingBottom: 4 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { paddingHorizontal: spacing.md, paddingBottom: 100 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 4 },
  partySizeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20 },
  stepBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1.5, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  stepBtnFill: { backgroundColor: colors.primary, borderColor: colors.primary },
  partyNum: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, minWidth: 28, textAlign: 'center' },
  guestsLabel: { fontSize: 14, color: colors.textMuted },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 20 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  chipTextActive: { color: colors.white },
  slotsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  slotBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: radius.md, backgroundColor: colors.primaryPale },
  slotBtnActive: { backgroundColor: colors.primary },
  slotText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  slotTextActive: { color: colors.white },
  textArea: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 12, fontSize: 14, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border, minHeight: 80, textAlignVertical: 'top' },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  cta: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  ctaDisabled: { backgroundColor: colors.surfaceAlt },
  ctaText: { fontSize: 15, fontWeight: '700', color: colors.white },
  ctaTextDisabled: { color: colors.textMuted },
  confirmCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginBottom: 14 },
  confirmRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  confirmLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmLabel: { fontSize: 14, color: colors.textMuted },
  confirmValue: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  notesCard: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: spacing.md, marginBottom: 14 },
  notesLabel: { fontSize: 12, color: colors.textMuted, marginBottom: 4 },
  notesText: { fontSize: 14, color: colors.textPrimary },
  pointsCard: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.primaryPale, borderRadius: radius.lg, padding: 12, marginBottom: 14 },
  pointsTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  pointsSub: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  terms: { fontSize: 12, color: colors.textMuted, textAlign: 'center', lineHeight: 18 },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20, ...shadow.md },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24 },
  ticketCard: { width: '100%', borderRadius: radius.xl, padding: spacing.md, marginBottom: 16 },
  ticketTop: { marginBottom: 14 },
  ticketName: { color: colors.white, fontSize: 18, fontWeight: '700' },
  ticketCuisine: { color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 2 },
  ticketDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.15)', marginVertical: 12 },
  ticketGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 16 },
  ticketCell: { width: '45%' },
  ticketLabel: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 3 },
  ticketValue: { fontSize: 15, fontWeight: '700', color: colors.white },
  codeLabel: { fontSize: 12, color: 'rgba(255,255,255,0.55)', textAlign: 'center', marginBottom: 4 },
  code: { fontSize: 22, fontWeight: '800', color: colors.primaryLight, textAlign: 'center', letterSpacing: 3 },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 16, width: '100%' },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, paddingVertical: 14, borderWidth: 1, borderColor: colors.border },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
})
