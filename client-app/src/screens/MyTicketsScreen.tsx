import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { useTickets } from '../context/TicketsContext'
import { RootStackParamList } from '../navigation'
import TicketQR from '../components/TicketQR'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function MyTicketsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { tickets } = useTickets()

  const upcoming = tickets.filter(t => t.status === 'upcoming')
  const past = tickets.filter(t => t.status === 'past')

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>My Tickets</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {tickets.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Ionicons name="ticket-outline" size={48} color={colors.textLight} />
            </View>
            <Text style={styles.emptyTitle}>No tickets yet</Text>
            <Text style={styles.emptySub}>Browse events and book your first ticket</Text>
            <Pressable style={styles.browseBtn} onPress={() => nav.popToTop()}>
              <Text style={styles.browseBtnText}>Explore Events</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {upcoming.length > 0 && (
              <>
                <Text style={styles.sectionTitle}>Upcoming ({upcoming.length})</Text>
                {upcoming.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} />
                ))}
              </>
            )}
            {past.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 8 }]}>Past ({past.length})</Text>
                {past.map(ticket => (
                  <TicketCard key={ticket.id} ticket={ticket} past />
                ))}
              </>
            )}
          </>
        )}
        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

function TicketCard({ ticket, past }: { ticket: any; past?: boolean }) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  return (
    <LinearGradient
      colors={past ? ['#1A1A2E', '#16213E'] : ['#0D1B2A', '#0D2A1B']}
      style={styles.card}
    >
      <View style={styles.perfRow}>
        {Array.from({ length: 14 }).map((_, i) => <View key={i} style={styles.perf} />)}
      </View>

      <View style={styles.cardBody}>
        <View style={styles.cardLeft}>
          {past && (
            <View style={styles.pastBadge}>
              <Text style={styles.pastBadgeText}>Past Event</Text>
            </View>
          )}
          <Text style={styles.eventName} numberOfLines={2}>{ticket.eventName}</Text>
          {ticket.eventDate ? <Text style={styles.eventDate}>{ticket.eventDate}</Text> : null}
          {ticket.eventTime ? <Text style={styles.eventTime}>{ticket.eventTime}</Text> : null}
          <Text style={styles.venue} numberOfLines={1}>{ticket.venue}</Text>

          <View style={styles.tierBadge}>
            <Ionicons name="ticket" size={12} color={colors.primaryLight} />
            <Text style={styles.tierText}>{ticket.quantity}× {ticket.tierName}</Text>
          </View>

          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Paid</Text>
            <Text style={styles.metaValue}>${ticket.totalPrice.toFixed(2)}</Text>
          </View>

          <View style={styles.codeWrap}>
            <Text style={styles.codeLabel}>REF</Text>
            <Text style={styles.code}>{ticket.confirmationCode}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardRight}>
          <TicketQR value={ticket.confirmationCode} size={84} />
          <Text style={styles.qrHint}>Scan at entry</Text>
          {past && (
            <View style={styles.usedStamp}>
              <Text style={styles.usedText}>USED</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.perfRow}>
        {Array.from({ length: 14 }).map((_, i) => <View key={i} style={styles.perf} />)}
      </View>
    </LinearGradient>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },

  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },

  empty: { alignItems: 'center', paddingTop: 80, gap: 12 },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 32 },
  browseBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  browseBtnText: { fontSize: 14, fontWeight: '700', color: colors.white },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 12 },

  card: { borderRadius: radius.xl, overflow: 'hidden', marginBottom: 14, ...shadow.md },
  perfRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4, paddingVertical: 5 },
  perf: { width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.12)' },
  cardBody: { flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 4, alignItems: 'center' },
  cardLeft: { flex: 1, paddingRight: 12 },
  pastBadge: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', marginBottom: 6 },
  pastBadgeText: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.5)', letterSpacing: 1 },
  eventName: { fontSize: 16, fontWeight: '800', color: colors.white, marginBottom: 5, lineHeight: 21 },
  eventDate: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginBottom: 1 },
  eventTime: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginBottom: 3 },
  venue: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginBottom: 10 },
  tierBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'flex-start', marginBottom: 10 },
  tierText: { fontSize: 12, color: colors.primaryLight, fontWeight: '600' },
  metaRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 },
  metaLabel: { fontSize: 10, color: 'rgba(255,255,255,0.45)' },
  metaValue: { fontSize: 15, fontWeight: '800', color: colors.white },
  codeWrap: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: radius.md, padding: 7 },
  codeLabel: { fontSize: 9, color: 'rgba(255,255,255,0.4)', marginBottom: 1 },
  code: { fontSize: 13, fontWeight: '800', color: colors.primaryLight, letterSpacing: 2 },
  divider: { width: 1, alignSelf: 'stretch', backgroundColor: 'rgba(255,255,255,0.1)', marginHorizontal: 8 },
  cardRight: { alignItems: 'center', gap: 6 },
  qrHint: { fontSize: 9, color: 'rgba(255,255,255,0.4)', textAlign: 'center' },
  usedStamp: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
  usedText: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.4)', letterSpacing: 2 },
})
