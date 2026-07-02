import React from 'react'
import { View, Text, ScrollView, Pressable, FlatList, StyleSheet, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { LinearGradient } from 'expo-linear-gradient'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated'
import { spacing, radius, shadow, fonts, cut } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { listings, currentUser } from '../data/mock'
import VenueCard from '../components/VenueCard'
import Tappable from '../components/Tappable'
import useCountUp from '../hooks/useCountUp'
import { RootStackParamList } from '../navigation'
import { Listing } from '../data/mock'
import { useNotifications } from '../context/NotificationsContext'

type Nav = NativeStackNavigationProp<RootStackParamList>

type Cat = {
  id: string
  label: string
  icon: keyof typeof Ionicons.glyphMap
  bg: string
  color: string       // icon color in dark mode
  lightColor: string  // icon color in light mode
  category?: string
  query?: string
  screen?: keyof RootStackParamList
}

const CATEGORIES: Cat[] = [
  { id: 'food', label: 'Food', icon: 'fast-food', bg: 'rgba(245,158,11,0.16)', color: '#FBBF24', lightColor: '#D97706', category: 'food' },
  { id: 'groceries', label: 'Grocery', icon: 'bag-handle', bg: 'rgba(34,197,94,0.16)', color: '#4ADE80', lightColor: '#16A34A', category: 'groceries' },
  { id: 'courier', label: 'Courier', icon: 'cube', bg: 'rgba(20,184,166,0.18)', color: '#2DD4BF', lightColor: '#0D9488', screen: 'Courier' },
  { id: 'events', label: 'Events', icon: 'ticket', bg: 'rgba(168,85,247,0.18)', color: '#C084FC', lightColor: '#9333EA', category: 'events' },
  { id: 'experiences', label: 'Experiences', icon: 'compass', bg: 'rgba(59,130,246,0.18)', color: '#60A5FA', lightColor: '#2563EB', category: 'experiences' },
  { id: 'coffee', label: 'Coffee', icon: 'cafe', bg: 'rgba(249,115,22,0.16)', color: '#FB923C', lightColor: '#C2410C', category: 'food', query: 'coffee' },
  { id: 'restaurants', label: 'Restaurants', icon: 'storefront', bg: 'rgba(239,68,68,0.16)', color: '#F87171', lightColor: '#DC2626', category: 'food' },
  { id: 'wellness', label: 'Wellness', icon: 'sparkles', bg: 'rgba(20,184,166,0.18)', color: '#2DD4BF', lightColor: '#0D9488', category: 'experiences', query: 'wellness' },
  { id: 'offers', label: 'Offers', icon: 'pricetag', bg: 'rgba(34,197,94,0.16)', color: '#4ADE80', lightColor: '#15803D', screen: 'Offers' },
]

const EXPLORE = [
  { label: 'Restaurants', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=260&fit=crop', cat: 'food' },
  { label: 'Groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400&h=260&fit=crop', cat: 'groceries' },
  { label: 'Events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=400&h=260&fit=crop', cat: 'events' },
  { label: 'Experiences', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=400&h=260&fit=crop', cat: 'experiences' },
]

export default function HomeScreen() {
  const { colors, isDark } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { unreadCount } = useNotifications()
  const popular = listings.filter(l => l.popular)
  const events = listings.filter(l => l.category === 'events')
  const experiences = listings.filter(l => l.category === 'experiences')
  const foodSpots = listings.filter(l => l.category === 'food')

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  const tierProgress = Math.min(currentUser.points / currentUser.nextTierPoints, 1)
  const ptsToNext = Math.max(currentUser.nextTierPoints - currentUser.points, 0)
  const animatedPts = useCountUp(currentUser.points, 900)

  const goToDetail = (l: Listing) => nav.navigate('Detail', { listing: l })
  const goToBooking = (l: Listing, slot: string) => nav.navigate('Booking', { listing: l, slot })
  const goToSearch = (category?: string, query?: string) =>
    (nav as any).navigate('Search', category || query ? { category, query } : undefined)

  const onCategory = (cat: Cat) => {
    if (cat.screen) { (nav as any).navigate(cat.screen); return }
    goToSearch(cat.category, cat.query)
  }

  return (
    <View style={styles.safe}>
      {/* ── Green hero header (pinned — stays while content scrolls) ── */}
      <LinearGradient
        colors={['#166534', '#15803D', '#16A34A']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
          <View style={styles.heroSlash} />
          <View style={styles.heroSlashSmall} />
          <SafeAreaView edges={['top']}>
            <View style={styles.heroTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.greeting}>{greeting},</Text>
                <Text style={styles.headline}>{currentUser.firstName} 👋</Text>
              </View>
              <Pressable style={styles.notifBtn} onPress={() => (nav as any).navigate('Notifications')}>
                <Ionicons name="notifications-outline" size={22} color={colors.white} />
                {unreadCount > 0 && (
                  <View style={styles.notifBadge}>
                    <Text style={styles.notifBadgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                  </View>
                )}
              </Pressable>
            </View>

            <Pressable onPress={() => goToSearch()} style={styles.searchBar}>
              <Ionicons name="search-outline" size={18} color={colors.textMuted} />
              <Text style={styles.searchPlaceholder}>Search restaurants, groceries, events…</Text>
            </Pressable>

            <View style={styles.locationRow}>
              <Ionicons name="location" size={14} color={colors.white} />
              <Text style={styles.locationText}>Borrowdale, Harare</Text>
              <Ionicons name="chevron-down" size={14} color="rgba(255,255,255,0.85)" />
            </View>
          </SafeAreaView>
      </LinearGradient>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* ── Quick categories ── */}
        <Animated.View entering={FadeIn.duration(400)} style={styles.catGrid}>
          {CATEGORIES.map(cat => (
            <Tappable key={cat.id} style={styles.catItem} onPress={() => onCategory(cat)} scaleTo={0.92}>
              <View style={[styles.catIcon, { backgroundColor: colors.primaryPale }]}>
                <Ionicons name={cat.icon} size={24} color={colors.primaryMid} />
              </View>
              <Text style={styles.catLabel}>{cat.label}</Text>
            </Tappable>
          ))}
        </Animated.View>

        {/* ── Loyalty card (green) ── */}
        <Animated.View entering={FadeInDown.delay(80).springify().damping(16)}>
          <Tappable onPress={() => (nav as any).navigate('Profile')}>
            <LinearGradient
              colors={['#15803D', '#16A34A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.loyaltyCard}
            >
              <View style={styles.loyaltyTop}>
                <View style={styles.loyaltyBadge}>
                  <Ionicons name="sparkles" size={14} color={colors.white} />
                  <Text style={styles.loyaltyTier}>{currentUser.tier} member</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.9)" />
              </View>
              <Text style={styles.loyaltyPoints}>{Math.round(animatedPts).toLocaleString()} <Text style={styles.loyaltyPointsUnit}>pts</Text></Text>
              <View style={styles.progressTrack}>
                <View style={[styles.progressFill, { width: `${tierProgress * 100}%` }]} />
              </View>
              <Text style={styles.loyaltySub}>{ptsToNext.toLocaleString()} pts to your next reward</Text>
            </LinearGradient>
          </Tappable>
        </Animated.View>

        {/* ── Popular Near You ── */}
        <Section title="Popular Near You" onSeeAll={() => goToSearch()}>
          <FlatList
            data={popular}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
            renderItem={({ item }) => (
              <VenueCard listing={item} onPress={goToDetail} onSlotPress={goToBooking} horizontal />
            )}
          />
        </Section>

        {/* ── Promo banner ── */}
        <Pressable onPress={() => (nav as any).navigate('Offers')} style={{ paddingHorizontal: spacing.md, marginBottom: spacing.lg }}>
          <LinearGradient
            colors={['#0D1B2A', '#166534']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.promo}
          >
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTag}>LIMITED OFFER</Text>
              <Text style={styles.promoTitle}>20% off your first{'\n'}grocery delivery</Text>
              <View style={styles.promoBtn}>
                <Text style={styles.promoBtnText}>Order now</Text>
                <Ionicons name="arrow-forward" size={13} color={colors.primary} />
              </View>
            </View>
            <Ionicons name="bag-handle" size={64} color="rgba(255,255,255,0.16)" style={styles.promoIcon} />
          </LinearGradient>
        </Pressable>

        {/* ── Upcoming Events ── */}
        <Section title="Upcoming Events" onSeeAll={() => goToSearch('events')}>
          <FlatList
            data={events}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
            renderItem={({ item }) => (
              <VenueCard listing={item} onPress={goToDetail} onSlotPress={goToBooking} horizontal />
            )}
          />
        </Section>

        {/* ── Explore by Category ── */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          <Text style={styles.sectionTitle}>Explore by Category</Text>
          <View style={styles.exploreGrid}>
            {EXPLORE.map(tile => (
              <Pressable key={tile.label} style={styles.exploreTile} onPress={() => goToSearch(tile.cat)}>
                <Image source={{ uri: tile.image }} style={styles.exploreImage} />
                <View style={styles.exploreOverlay} />
                <Text style={styles.exploreLabel}>{tile.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── Experiences ── */}
        <Section title="Experiences in Harare" onSeeAll={() => goToSearch('experiences')}>
          <FlatList
            data={experiences}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={i => String(i.id)}
            contentContainerStyle={{ paddingHorizontal: spacing.md, gap: 12 }}
            renderItem={({ item }) => (
              <VenueCard listing={item} onPress={goToDetail} onSlotPress={goToBooking} horizontal />
            )}
          />
        </Section>

        {/* ── Trending (food list) ── */}
        <View style={[styles.section, { paddingHorizontal: spacing.md }]}>
          <View style={styles.rowBetween}>
            <Text style={styles.sectionTitle}>Trending Restaurants</Text>
            <Pressable onPress={() => goToSearch('food')}>
              <Text style={styles.seeAll}>See all</Text>
            </Pressable>
          </View>
          {foodSpots.slice(0, 4).map(l => (
            <Pressable key={l.id} style={styles.trendRow} onPress={() => goToDetail(l)}>
              <Image source={{ uri: l.image }} style={styles.trendImage} />
              <View style={styles.trendInfo}>
                <Text style={styles.trendName}>{l.name}</Text>
                <Text style={styles.trendCuisine}>{l.cuisine}</Text>
                <View style={styles.trendMeta}>
                  <Ionicons name="star" size={11} color={colors.amber} />
                  <Text style={styles.trendMetaText}> {l.rating}</Text>
                  <Text style={styles.trendDot}> · </Text>
                  <Text style={styles.trendMetaText}>{l.distance}</Text>
                  <Text style={styles.trendDot}> · </Text>
                  <Text style={styles.trendMetaText}>{l.priceLevel}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

function Section({ title, onSeeAll, children }: { title: string; onSeeAll?: () => void; children: React.ReactNode }) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  return (
    <View style={styles.section}>
      <View style={styles.rowBetween}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {onSeeAll && (
          <Pressable onPress={onSeeAll}>
            <Text style={styles.seeAll}>See all</Text>
          </Pressable>
        )}
      </View>
      {children}
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Hero
  hero: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 32,
    overflow: 'hidden',
  },
  heroSlash: { position: 'absolute', top: -50, right: -40, width: 150, height: 150, borderRadius: 44, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '22deg' }] },
  heroSlashSmall: { position: 'absolute', bottom: -30, left: -20, width: 90, height: 90, borderRadius: 26, backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ rotate: '-10deg' }] },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingTop: spacing.sm, paddingBottom: spacing.md },
  greeting: { fontFamily: fonts.body, fontSize: 14, color: 'rgba(255,255,255,0.85)', marginBottom: 2 },
  headline: { fontFamily: fonts.display, fontSize: 26, color: colors.white, letterSpacing: -0.8 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center', position: 'relative' },
  notifBadge: { position: 'absolute', top: 5, right: 5, minWidth: 17, height: 17, borderRadius: 9, paddingHorizontal: 4, backgroundColor: '#EF4444', alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: '#15803D' },
  notifBadgeText: { fontFamily: fonts.bodyBold, fontSize: 9, color: colors.white },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 13, marginBottom: spacing.md, ...shadow.sm },
  searchPlaceholder: { fontFamily: fonts.body, fontSize: 14, color: colors.textMuted, flex: 1 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  locationText: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.white },

  // Categories
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing.md, marginTop: spacing.lg, marginBottom: spacing.sm, rowGap: spacing.md },
  catItem: { width: '25%', alignItems: 'center', gap: 8, marginBottom: spacing.sm },
  catIcon: {
    width: 58, height: 58, alignItems: 'center', justifyContent: 'center',
    borderTopLeftRadius: 20, borderTopRightRadius: 8, borderBottomRightRadius: 20, borderBottomLeftRadius: 8,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
  },
  catLabel: { fontFamily: fonts.bodySemi, fontSize: 11.5, color: colors.textPrimary },

  // Loyalty card
  loyaltyCard: { marginHorizontal: spacing.md, ...cut.card, padding: spacing.md, marginBottom: spacing.lg, ...shadow.md },
  loyaltyTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  loyaltyBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.2)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: radius.full },
  loyaltyTier: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.white },
  loyaltyPoints: { fontFamily: fonts.display, fontSize: 34, color: colors.white, letterSpacing: -1, marginBottom: 12 },
  loyaltyPointsUnit: { fontFamily: fonts.displayLight, fontSize: 16, color: 'rgba(255,255,255,0.85)' },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', borderRadius: 3, backgroundColor: colors.white },
  loyaltySub: { fontFamily: fonts.body, fontSize: 12, color: 'rgba(255,255,255,0.9)' },

  // Sections
  section: { marginBottom: spacing.lg },
  sectionTitle: { fontFamily: fonts.displayMid, fontSize: 18, color: colors.textPrimary, marginBottom: 14, letterSpacing: -0.3 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md },
  seeAll: { fontFamily: fonts.bodySemi, fontSize: 13, color: colors.primary },

  // Promo
  promo: { flexDirection: 'row', alignItems: 'center', ...cut.cardFlip, padding: spacing.md, overflow: 'hidden', ...shadow.md },
  promoTag: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#FCD34D', letterSpacing: 1.2, marginBottom: 6 },
  promoTitle: { fontFamily: fonts.display, fontSize: 18, color: colors.white, lineHeight: 23, marginBottom: 12, letterSpacing: -0.4 },
  promoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start', backgroundColor: colors.white, paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.full },
  promoBtnText: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  promoIcon: { position: 'absolute', right: 8, bottom: -6 },

  // Explore grid
  exploreGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exploreTile: { width: '48%', height: 110, ...cut.card, overflow: 'hidden', position: 'relative' },
  exploreImage: { width: '100%', height: '100%' },
  exploreOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  exploreLabel: { position: 'absolute', bottom: 10, left: 12, color: colors.white, fontFamily: fonts.bodyBold, fontSize: 14 },

  // Trending
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border, padding: 10, marginBottom: 8, marginHorizontal: 0 },
  trendImage: { width: 54, height: 54, borderRadius: radius.md },
  trendInfo: { flex: 1 },
  trendName: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.textPrimary },
  trendCuisine: { fontFamily: fonts.bodyReg, fontSize: 12, color: colors.textMuted, marginTop: 1, marginBottom: 4 },
  trendMeta: { flexDirection: 'row', alignItems: 'center' },
  trendMetaText: { fontFamily: fonts.body, fontSize: 12, color: colors.textMuted },
  trendDot: { fontSize: 12, color: colors.textLight },
})
