import React from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { useFavorites } from '../context/FavoritesContext'
import { Listing } from '../data/mock'
import VenueCard from '../components/VenueCard'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function FavoritesScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { favoriteListings, count } = useFavorites()

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Saved</Text>
        <View style={{ width: 36 }} />
      </View>

      {count === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}>
            <Ionicons name="heart-outline" size={44} color={colors.textLight} />
          </View>
          <Text style={styles.emptyTitle}>No saved spots yet</Text>
          <Text style={styles.emptySub}>Tap the heart on any venue to save it here for later.</Text>
          <Pressable style={styles.browseBtn} onPress={() => (nav as any).navigate('MainTabs', { screen: 'Home' })}>
            <Text style={styles.browseBtnText}>Discover places</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          <Text style={styles.count}>{count} saved {count === 1 ? 'spot' : 'spots'}</Text>
          {favoriteListings.map((l: Listing) => (
            <View key={l.id} style={{ marginBottom: 14 }}>
              <VenueCard
                listing={l}
                onPress={x => nav.navigate('Detail', { listing: x })}
                onSlotPress={(x, slot) => nav.navigate('Booking', { listing: x, slot })}
              />
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  count: { fontSize: 13, color: colors.textMuted, fontWeight: '600', marginBottom: 14 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: spacing.xl },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
  browseBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingHorizontal: 28, paddingVertical: 14, marginTop: 8 },
  browseBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
})
