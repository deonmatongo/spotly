import React, { useState, useMemo, useEffect } from 'react'
import { View, Text, TextInput, ScrollView, Pressable, FlatList, StyleSheet, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { Listing } from '../data/mock'
import { useListings } from '../context/ListingsContext'
import VenueCard from '../components/VenueCard'
import { RootStackParamList, TabParamList } from '../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList>
type Route = RouteProp<TabParamList, 'Search'>

const CATS = ['All', 'Food', 'Groceries', 'Events', 'Experiences']
const PRICES = ['$', '$$', '$$$', '$$$$']

// Category-specific facets. Each option filters by matching the listing's tags / cuisine / type.
const CATEGORY_FILTERS: Record<string, { label: string; options: string[] }[]> = {
  All: [
    { label: 'Vibe', options: ['Date Night', 'Group-Friendly', 'Outdoor', 'Live Music'] },
  ],
  Food: [
    { label: 'Cuisine', options: ['Zimbabwean', 'Braai', 'Italian', 'Indian', 'Japanese', 'Café'] },
    { label: 'Dietary', options: ['Vegetarian-Friendly', 'Halal', 'Farm-to-Table'] },
    { label: 'Features', options: ['Outdoor', 'Delivery', 'Group-Friendly', 'Date Night'] },
  ],
  Groceries: [
    { label: 'Store type', options: ['Organic', 'Local Produce', 'Butcher', 'Convenience'] },
    { label: 'Perks', options: ['Express Delivery', 'Health', 'Budget'] },
  ],
  Events: [
    { label: 'Event type', options: ['Concert', 'Sport', 'Comedy', 'Festival', 'Conference', 'Fashion'] },
    { label: 'Vibe', options: ['Live Music', 'Outdoor', 'Networking', 'Harare'] },
  ],
  Experiences: [
    { label: 'Type', options: ['Wellness', 'Adventure', 'Arts', 'Wildlife', 'Hiking'] },
    { label: 'Who for', options: ['Solo', 'Couples', 'Group-Friendly'] },
  ],
}

export default function SearchScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const route = useRoute<Route>()
  const { listings } = useListings()
  const [query, setQuery] = useState(route.params?.query ?? '')
  const [cat, setCat] = useState(
    route.params?.category ? route.params.category.charAt(0).toUpperCase() + route.params.category.slice(1) : 'All'
  )
  const [showFilters, setShowFilters] = useState(false)
  const [selectedPrices, setSelectedPrices] = useState<string[]>([])
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [minRating, setMinRating] = useState(0)

  // Re-apply the filter whenever a new category/query arrives from the Home tiles
  // (the Search tab stays mounted, so tapping Events then Experiences must update here).
  useEffect(() => {
    if (route.params?.category) {
      const c = route.params.category
      setCat(c.charAt(0).toUpperCase() + c.slice(1))
      setQuery(route.params.query ?? '')
      setSelectedTags([])
    } else if (route.params?.query !== undefined) {
      setQuery(route.params.query)
    }
  }, [route.params?.category, route.params?.query])

  // Switching category clears category-specific tag selections (facets differ per category)
  const chooseCat = (c: string) => { setCat(c); setSelectedTags([]) }

  const facets = CATEGORY_FILTERS[cat] ?? CATEGORY_FILTERS.All

  const results = useMemo(() => listings.filter(l => {
    const q = query.toLowerCase()
    const matchQ = !q || l.name.toLowerCase().includes(q) || l.cuisine.toLowerCase().includes(q)
    const matchC = cat === 'All' || l.category === cat.toLowerCase() || l.category === cat.toLowerCase() + 's'
    const matchP = selectedPrices.length === 0 || selectedPrices.includes(l.priceLevel)
    const matchR = l.rating >= minRating
    // themed tags: listing passes if it matches at least one selected facet option
    const haystack = (l.tags.join(' ') + ' ' + l.cuisine + ' ' + l.type).toLowerCase()
    const matchTags = selectedTags.length === 0 || selectedTags.some(t => haystack.includes(t.toLowerCase()))
    return matchQ && matchC && matchP && matchR && matchTags
  }), [query, cat, selectedPrices, minRating, selectedTags])

  const toggle = (arr: string[], setArr: (v: string[]) => void, val: string) =>
    setArr(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])

  const activeFilters = selectedPrices.length + selectedTags.length + (minRating > 0 ? 1 : 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* Search input */}
      <View style={styles.searchWrap}>
        <View style={styles.inputRow}>
          <Ionicons name="search-outline" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Restaurants, groceries, events…"
            placeholderTextColor={colors.textMuted}
            autoFocus={!route.params?.category}
          />
          {!!query && (
            <Pressable onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </Pressable>
          )}
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll} contentContainerStyle={{ gap: 8 }}>
          {CATS.map(c => (
            <Pressable key={c} onPress={() => chooseCat(c)} style={[styles.catChip, cat === c && styles.catChipActive]}>
              <Text style={[styles.catChipText, cat === c && styles.catChipTextActive]}>{c}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {/* Filter bar */}
      <View style={styles.filterBar}>
        {[
          { icon: 'people-outline' as const, label: '2 Guests' },
          { icon: 'calendar-outline' as const, label: 'Tonight' },
          { icon: 'time-outline' as const, label: 'Any time' },
        ].map(f => (
          <View key={f.label} style={styles.filterChip}>
            <Ionicons name={f.icon} size={13} color={colors.primary} />
            <Text style={styles.filterChipText}>{f.label}</Text>
          </View>
        ))}
        <Pressable onPress={() => setShowFilters(true)} style={[styles.filterBtn, activeFilters > 0 && styles.filterBtnActive]}>
          <Ionicons name="options-outline" size={14} color={activeFilters > 0 ? colors.white : colors.textPrimary} />
          <Text style={[styles.filterBtnText, activeFilters > 0 && { color: colors.white }]}>Filters</Text>
          {activeFilters > 0 && <View style={styles.filterCount}><Text style={styles.filterCountText}>{activeFilters}</Text></View>}
        </Pressable>
      </View>

      <Text style={styles.resultsCount}>{results.length} results</Text>

      <FlatList
        data={results}
        keyExtractor={i => String(i.id)}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <VenueCard
            listing={item}
            onPress={l => nav.navigate('Detail', { listing: l })}
            onSlotPress={(l, slot) => nav.navigate('Booking', { listing: l, slot })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>No results found</Text>
            <Text style={styles.emptyText}>Try adjusting your filters</Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Filters Modal */}
      <Modal visible={showFilters} transparent animationType="slide" onRequestClose={() => setShowFilters(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowFilters(false)} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Filters</Text>
            <Pressable onPress={() => { setSelectedPrices([]); setSelectedTags([]); setMinRating(0) }}>
              <Text style={styles.clearAll}>Clear all</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={styles.filterSection}>Price Level</Text>
            <View style={styles.chipRow}>
              {PRICES.map(p => (
                <Pressable key={p} onPress={() => toggle(selectedPrices, setSelectedPrices, p)} style={[styles.optChip, selectedPrices.includes(p) && styles.optChipActive]}>
                  <Text style={[styles.optChipText, selectedPrices.includes(p) && styles.optChipTextActive]}>{p}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.filterSection}>Min Rating</Text>
            <View style={styles.chipRow}>
              {[0, 3.5, 4.0, 4.5].map(r => (
                <Pressable key={r} onPress={() => setMinRating(r)} style={[styles.optChip, minRating === r && styles.optChipActive]}>
                  <Text style={[styles.optChipText, minRating === r && styles.optChipTextActive]}>{r === 0 ? 'Any' : `${r}+`}</Text>
                </Pressable>
              ))}
            </View>

            {facets.map(facet => (
              <View key={facet.label}>
                <Text style={styles.filterSection}>{facet.label}</Text>
                <View style={styles.chipRow}>
                  {facet.options.map(opt => (
                    <Pressable key={opt} onPress={() => toggle(selectedTags, setSelectedTags, opt)} style={[styles.optChip, selectedTags.includes(opt) && styles.optChipActive]}>
                      <Text style={[styles.optChipText, selectedTags.includes(opt) && styles.optChipTextActive]}>{opt}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            ))}
          </ScrollView>

          <Pressable style={styles.applyBtn} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyBtnText}>Show {results.length} Results</Text>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  searchWrap: { backgroundColor: colors.surface, paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.xl, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  catScroll: { marginBottom: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.surface },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  catChipTextActive: { color: colors.white },
  filterBar: { flexDirection: 'row', gap: 8, paddingHorizontal: spacing.md, paddingVertical: 10, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: colors.surfaceAlt, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 7 },
  filterChipText: { fontSize: 12, fontWeight: '600', color: colors.textPrimary },
  filterBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 5, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: 10, paddingVertical: 7 },
  filterBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterBtnText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  filterCount: { width: 16, height: 16, borderRadius: 8, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  filterCountText: { fontSize: 9, fontWeight: '800', color: colors.primary },
  resultsCount: { fontSize: 12, color: colors.textMuted, fontWeight: '500', paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 4 },
  list: { paddingHorizontal: spacing.md, paddingBottom: 100, gap: 14 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 12 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  emptyText: { fontSize: 14, color: colors.textMuted },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.md, maxHeight: '75%' },
  handle: { width: 40, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  clearAll: { fontSize: 14, fontWeight: '600', color: colors.primary },
  filterSection: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 10, marginTop: 16 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border },
  optChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  optChipText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  optChipTextActive: { color: colors.white },
  applyBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, alignItems: 'center', marginTop: 20, marginBottom: 10 },
  applyBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
})
