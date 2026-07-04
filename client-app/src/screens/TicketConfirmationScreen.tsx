import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet, Alert, Share } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import * as Calendar from 'expo-calendar'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import TicketQR from '../components/TicketQR'
import { parseEventDate } from '../utils/eventDate'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<RootStackParamList, 'TicketConfirmation'>

export default function TicketConfirmationScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { orderNumber, email, eventName, total, items, eventDate, eventTime, venue } = useRoute<Route>().params
  const [calendarAdded, setCalendarAdded] = useState(false)
  const [calendarLoading, setCalendarLoading] = useState(false)

  const addToCalendar = async () => {
    setCalendarLoading(true)
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please allow calendar access in Settings to save this event.')
        setCalendarLoading(false)
        return
      }

      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT)
      const defaultCal = calendars.find(c => c.allowsModifications) ?? calendars[0]

      if (!defaultCal) {
        Alert.alert('No calendar found', 'Could not find a writable calendar on this device.')
        setCalendarLoading(false)
        return
      }

      // Land on the real event date/time parsed from the ticket.
      const { start: startDate, end: endDate } = parseEventDate(eventDate, eventTime)

      await Calendar.createEventAsync(defaultCal.id, {
        title: `🎟 ${eventName}`,
        location: venue,
        notes: `Spotly Ticket · ${orderNumber}\n${items} ticket${items !== 1 ? 's' : ''}\nEmail: ${email}`,
        startDate,
        endDate,
        alarms: [{ relativeOffset: -60 }, { relativeOffset: -1440 }],
      })

      setCalendarAdded(true)
      Alert.alert('Added to Calendar', `${eventName} has been saved to your calendar.`)
    } catch (e) {
      Alert.alert('Error', 'Could not add to calendar. Please try again.')
    }
    setCalendarLoading(false)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Success header */}
        <View style={styles.successHeader}>
          <View style={styles.checkCircle}>
            <Ionicons name="checkmark" size={32} color={colors.white} />
          </View>
          <Text style={styles.successTitle}>Tickets Confirmed!</Text>
          <Text style={styles.successSub}>
            Your tickets are saved in the app and a copy has been sent to {email}
          </Text>
        </View>

        {/* Digital Ticket */}
        <LinearGradient colors={['#0D1B2A', '#0D2A1B']} style={styles.ticketCard}>
          {/* Perforation top */}
          <View style={styles.perfRow}>
            {Array.from({ length: 14 }).map((_, i) => <View key={i} style={styles.perf} />)}
          </View>

          <View style={styles.ticketBody}>
            <View style={styles.ticketLeft}>
              <Text style={styles.ticketEvent}>{eventName}</Text>
              {eventDate ? <Text style={styles.ticketDate}>{eventDate}</Text> : null}
              {eventTime ? <Text style={styles.ticketTime}>{eventTime}</Text> : null}
              <Text style={styles.ticketVenue} numberOfLines={2}>{venue}</Text>

              <View style={styles.ticketMeta}>
                <View style={styles.ticketMetaItem}>
                  <Text style={styles.ticketMetaLabel}>Qty</Text>
                  <Text style={styles.ticketMetaValue}>{items}</Text>
                </View>
                <View style={styles.ticketMetaItem}>
                  <Text style={styles.ticketMetaLabel}>Total</Text>
                  <Text style={styles.ticketMetaValue}>${total.toFixed(2)}</Text>
                </View>
              </View>

              <View style={styles.codeRow}>
                <Text style={styles.codeLabel}>Confirmation</Text>
                <Text style={styles.code}>{orderNumber}</Text>
              </View>
            </View>

            <View style={styles.ticketDivider} />

            <View style={styles.ticketRight}>
              <TicketQR value={orderNumber} size={100} />
              <Text style={styles.qrLabel}>Scan at entry</Text>
            </View>
          </View>

          {/* Perforation bottom */}
          <View style={styles.perfRow}>
            {Array.from({ length: 14 }).map((_, i) => <View key={i} style={styles.perf} />)}
          </View>
        </LinearGradient>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <Pressable
            style={[styles.actionBtn, calendarAdded && styles.actionBtnDone]}
            onPress={addToCalendar}
            disabled={calendarLoading || calendarAdded}
          >
            <Ionicons
              name={calendarAdded ? 'checkmark-circle' : 'calendar-outline'}
              size={18}
              color={calendarAdded ? colors.primary : colors.textPrimary}
            />
            <Text style={[styles.actionBtnText, calendarAdded && { color: colors.primary }]}>
              {calendarAdded ? 'Added to Calendar' : 'Add to Calendar'}
            </Text>
          </Pressable>

          <Pressable
            style={styles.actionBtn}
            onPress={() => Share.share({ message: `I'm going to ${eventName}! 🎟 ${eventDate}${eventTime ? ' · ' + eventTime : ''} at ${venue}. Booked on Spotly · ${orderNumber}` })}
          >
            <Ionicons name="share-outline" size={18} color={colors.textPrimary} />
            <Text style={styles.actionBtnText}>Share</Text>
          </Pressable>
        </View>

        {/* Email notice */}
        <View style={styles.emailNotice}>
          <Ionicons name="mail-outline" size={16} color={colors.primary} />
          <Text style={styles.emailNoticeText}>
            Tickets emailed to <Text style={{ fontWeight: '700' }}>{email}</Text>
          </Text>
        </View>

        {/* Spotly Points earned */}
        <View style={styles.pointsRow}>
          <Ionicons name="sparkles" size={16} color={colors.primary} />
          <Text style={styles.pointsText}>Spotly Points added to your balance</Text>
        </View>

        {/* Buttons */}
        <Pressable
          style={styles.myTicketsBtn}
          onPress={() => nav.navigate('MyTickets' as any)}
        >
          <Ionicons name="ticket-outline" size={18} color={colors.primary} />
          <Text style={styles.myTicketsBtnText}>View My Tickets</Text>
        </Pressable>

        <Pressable style={styles.homeBtn} onPress={() => nav.popToTop()}>
          <Text style={styles.homeBtnText}>Back to Home</Text>
        </Pressable>

        <View style={{ height: 24 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.lg, paddingBottom: 32 },

  successHeader: { alignItems: 'center', marginBottom: 24 },
  checkCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadow.md },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 8 },
  successSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', lineHeight: 20, paddingHorizontal: 16 },

  ticketCard: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: 16, ...shadow.md },
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 6 },
  perf: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.15)' },
  ticketBody: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 8, alignItems: 'center' },
  ticketLeft: { flex: 1, paddingRight: 12 },
  ticketEvent: { fontSize: 17, fontWeight: '800', color: colors.white, marginBottom: 6, lineHeight: 22 },
  ticketDate: { fontSize: 13, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 2 },
  ticketTime: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginBottom: 4 },
  ticketVenue: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginBottom: 12, lineHeight: 16 },
  ticketMeta: { flexDirection: 'row', gap: 20, marginBottom: 12 },
  ticketMetaItem: {},
  ticketMetaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: '500' },
  ticketMetaValue: { fontSize: 16, fontWeight: '800', color: colors.white },
  codeRow: { backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: radius.md, padding: 8 },
  codeLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)' },
  code: { fontSize: 16, fontWeight: '800', color: colors.primaryLight, letterSpacing: 2 },
  ticketDivider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.12)', marginHorizontal: 8 },
  ticketRight: { alignItems: 'center', gap: 6 },
  qrLabel: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center' },

  actionsRow: { flexDirection: 'row', gap: 10, marginBottom: 12 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 14, borderWidth: 1, borderColor: colors.border },
  actionBtnDone: { borderColor: colors.primaryBorder, backgroundColor: colors.primaryPale },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },

  emailNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.surface, borderRadius: radius.lg, padding: 12, marginBottom: 10, borderWidth: 1, borderColor: colors.border },
  emailNoticeText: { fontSize: 13, color: colors.textMuted, flex: 1 },
  pointsRow: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryPale, borderRadius: radius.lg, padding: 12, marginBottom: 16 },
  pointsText: { fontSize: 13, fontWeight: '600', color: colors.primary },

  myTicketsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderWidth: 1.5, borderColor: colors.primary, borderRadius: radius.lg, paddingVertical: 14, marginBottom: 10 },
  myTicketsBtnText: { fontSize: 15, fontWeight: '700', color: colors.primary },
  homeBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  homeBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
})
