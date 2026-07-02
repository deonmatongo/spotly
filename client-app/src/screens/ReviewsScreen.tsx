import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { listings } from '../data/mock'
import { useReviews } from '../context/ReviewsContext'
import { useNotifications } from '../context/NotificationsContext'
import { RootStackParamList } from '../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function ReviewsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { allReviews, addReview } = useReviews()
  const { addNotification } = useNotifications()
  const [tab, setTab] = useState<'browse' | 'write'>('browse')
  const [selectedListing, setSelectedListing] = useState<number | null>(null)
  const [rating, setRating] = useState(0)
  const [hover, setHover] = useState(0)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  if (submitted) return (
    <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]} edges={['top', 'bottom']}>
      <View style={styles.checkCircle}><Ionicons name="checkmark" size={36} color={colors.white} /></View>
      <Text style={styles.successTitle}>Review Submitted!</Text>
      <Text style={styles.successSub}>Thanks for sharing your experience.</Text>
      <View style={styles.earnBadge}><Ionicons name="star" size={16} color={colors.amber} /><Text style={styles.earnText}>+25 Spotly Points for your review!</Text></View>
      <Pressable style={styles.backBtn} onPress={() => { setSubmitted(false); setTab('browse'); setRating(0); setText(''); setSelectedListing(null) }}>
        <Text style={styles.backBtnText}>Back to Reviews</Text>
      </Pressable>
    </SafeAreaView>
  )

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Pressable onPress={() => nav.goBack()} style={styles.headerBack}>
            <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
          </Pressable>
          <Text style={styles.title}>Reviews</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.toggle}>
          {(['browse', 'write'] as const).map(t => (
            <Pressable key={t} onPress={() => setTab(t)} style={[styles.toggleBtn, tab === t && styles.toggleBtnActive]}>
              <Text style={[styles.toggleText, tab === t && styles.toggleTextActive]}>
                {t === 'browse' ? 'Browse' : 'Leave a Review'}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {tab === 'browse' ? (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {allReviews.map(r => {
            const listing = listings.find(l => l.id === r.listingId)
            return (
              <View key={r.id} style={styles.reviewCard}>
                {listing && (
                  <View style={styles.reviewListing}>
                    <Image source={{ uri: listing.image }} style={styles.listingThumb} />
                    <View>
                      <Text style={styles.listingName}>{listing.name}</Text>
                      <Text style={styles.listingCuisine}>{listing.cuisine}</Text>
                    </View>
                  </View>
                )}
                <View style={styles.divider} />
                <View style={styles.reviewerRow}>
                  <Image source={{ uri: r.avatar }} style={styles.avatar} />
                  <View style={styles.reviewerInfo}>
                    <View style={styles.reviewerNameRow}>
                      <Text style={styles.reviewerName}>{r.user}</Text>
                      {r.verified && <View style={styles.verifiedBadge}><Text style={styles.verifiedText}>✓ Verified</Text></View>}
                    </View>
                    <View style={styles.starsRow}>
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Ionicons key={i} name="star" size={12} color={i < r.rating ? colors.amber : colors.border} />
                      ))}
                      <Text style={styles.reviewDate}> · {r.date}</Text>
                    </View>
                  </View>
                </View>
                <Text style={styles.reviewText}>{r.text}</Text>
              </View>
            )
          })}
        </ScrollView>
      ) : (
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.verifiedNote}>
            <Ionicons name="shield-checkmark-outline" size={18} color={colors.primary} />
            <View style={styles.verifiedNoteText}>
              <Text style={styles.verifiedNoteTitle}>Verified reviews only</Text>
              <Text style={styles.verifiedNoteSub}>Only guests who completed a booking can leave reviews.</Text>
            </View>
          </View>

          <Text style={styles.fieldLabel}>Select venue</Text>
          {listings.slice(0, 5).map(l => (
            <Pressable key={l.id} onPress={() => setSelectedListing(l.id)} style={[styles.venueOption, selectedListing === l.id && styles.venueOptionActive]}>
              <Image source={{ uri: l.image }} style={styles.venueOptionImg} />
              <View style={styles.venueOptionInfo}>
                <Text style={styles.venueOptionName}>{l.name}</Text>
                <Text style={styles.venueOptionCuisine}>{l.cuisine}</Text>
              </View>
              <View style={[styles.radio, selectedListing === l.id && styles.radioActive]}>
                {selectedListing === l.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}

          <Text style={styles.fieldLabel}>Your rating</Text>
          <View style={styles.starPicker}>
            {[1,2,3,4,5].map(s => (
              <Pressable key={s} onPress={() => setRating(s)} onPressIn={() => setHover(s)} onPressOut={() => setHover(0)}>
                <Ionicons name="star" size={36} color={(hover || rating) >= s ? colors.amber : colors.border} />
              </Pressable>
            ))}
          </View>
          {rating > 0 && <Text style={styles.ratingLabel}>{['','Poor','Fair','Good','Very Good','Excellent!'][rating]}</Text>}

          <Text style={styles.fieldLabel}>Your review</Text>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Tell others about your experience — food, service, atmosphere…"
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={5}
            style={styles.textArea}
          />
          <Text style={[styles.charCount, text.length >= 20 && { color: colors.primary }]}>
            {text.length}/20 minimum characters
          </Text>

          <Pressable
            onPress={() => {
              if (!(selectedListing && rating > 0 && text.length >= 20)) return
              addReview({ listingId: selectedListing, rating, text: text.trim() })
              const venue = listings.find(l => l.id === selectedListing)
              addNotification({ type: 'review', title: 'Review posted', body: `Thanks for reviewing ${venue?.name ?? 'the venue'}. You earned +25 Spotly Points!` })
              setSubmitted(true)
            }}
            style={[styles.submitBtn, !(selectedListing && rating > 0 && text.length >= 20) && styles.submitBtnDisabled]}
          >
            <Text style={[styles.submitBtnText, !(selectedListing && rating > 0 && text.length >= 20) && styles.submitBtnTextDisabled]}>
              Submit Review
            </Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerBack: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: colors.textPrimary, letterSpacing: -0.5 },
  toggle: { flexDirection: 'row', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 4 },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: radius.md, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: colors.surface },
  toggleText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  toggleTextActive: { color: colors.primary },
  scroll: { flex: 1 },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 100 },
  reviewCard: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: 14, marginBottom: 12 },
  reviewListing: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  listingThumb: { width: 40, height: 40, borderRadius: radius.md },
  listingName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  listingCuisine: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  divider: { height: 1, backgroundColor: colors.divider, marginBottom: 10 },
  reviewerRow: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  avatar: { width: 36, height: 36, borderRadius: 18 },
  reviewerInfo: { flex: 1 },
  reviewerNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  reviewerName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  verifiedBadge: { backgroundColor: colors.primaryPale, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 10 },
  verifiedText: { fontSize: 10, fontWeight: '700', color: colors.primary },
  starsRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  reviewDate: { fontSize: 11, color: colors.textMuted },
  reviewText: { fontSize: 13, color: colors.textMuted, lineHeight: 20 },
  verifiedNote: { flexDirection: 'row', gap: 10, backgroundColor: colors.primaryPale, borderRadius: radius.lg, padding: 14, marginBottom: 20 },
  verifiedNoteText: { flex: 1 },
  verifiedNoteTitle: { fontSize: 14, fontWeight: '700', color: colors.primary },
  verifiedNoteSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  fieldLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 4 },
  venueOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 10, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, marginBottom: 8 },
  venueOptionActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  venueOptionImg: { width: 44, height: 44, borderRadius: radius.md },
  venueOptionInfo: { flex: 1 },
  venueOptionName: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  venueOptionCuisine: { fontSize: 12, color: colors.textMuted, marginTop: 1 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  starPicker: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  ratingLabel: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  textArea: { backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 14, fontSize: 14, color: colors.textPrimary, borderWidth: 1.5, borderColor: colors.border, minHeight: 120, textAlignVertical: 'top', marginBottom: 6 },
  charCount: { fontSize: 12, color: colors.textMuted, textAlign: 'right', marginBottom: 20 },
  submitBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { backgroundColor: colors.surfaceAlt },
  submitBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  submitBtnTextDisabled: { color: colors.textMuted },
  checkCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 22, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 14, color: colors.textMuted, marginBottom: 20 },
  earnBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.primaryPale, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 28 },
  earnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  backBtn: { backgroundColor: colors.primary, paddingHorizontal: 40, paddingVertical: 14, borderRadius: radius.lg },
  backBtnText: { color: colors.white, fontWeight: '700', fontSize: 15 },
})
