import React from 'react'
import { View, Text, Image, ScrollView, Pressable, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { Listing } from '../data/mock'
import { useFavorites } from '../context/FavoritesContext'

interface Props {
  listing: Listing
  onPress: (l: Listing) => void
  onSlotPress?: (l: Listing, slot: string) => void
  horizontal?: boolean
}

export default function VenueCard({ listing, onPress, onSlotPress, horizontal = false }: Props) {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { isFavorite, toggleFavorite } = useFavorites()
  const liked = isFavorite(listing.id)

  return (
    <Pressable
      onPress={() => onPress(listing)}
      style={({ pressed }) => [styles.card, horizontal && styles.cardH, pressed && { opacity: 0.95, transform: [{ scale: 0.98 }] }]}
    >
      <View style={styles.imageWrap}>
        <Image source={{ uri: listing.image }} style={styles.image} />
        <Pressable onPress={() => toggleFavorite(listing.id)} hitSlop={8} style={styles.heartBtn}>
          <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.primary : '#64748B'} />
        </Pressable>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>{listing.cuisine.split(' · ')[0]}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <View style={styles.titleRow}>
          <Text style={styles.name} numberOfLines={1}>{listing.name}</Text>
          <Text style={styles.price}>{listing.priceLevel}</Text>
        </View>
        <Text style={styles.cuisine} numberOfLines={1}>{listing.cuisine}</Text>

        <View style={styles.meta}>
          <Ionicons name="star" size={12} color={colors.amber} />
          <Text style={styles.rating}>{listing.rating}</Text>
          <Text style={styles.reviewCount}>({listing.reviewCount})</Text>
          <View style={styles.dot} />
          <Ionicons name="location-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{listing.distance}</Text>
          <View style={styles.dot} />
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{listing.eta}</Text>
        </View>

        {listing.timeSlots && listing.timeSlots.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.slots} contentContainerStyle={{ gap: 6 }}>
            {listing.timeSlots.slice(0, 5).map(slot => (
              <Pressable
                key={slot}
                onPress={() => onSlotPress?.(listing, slot)}
                style={({ pressed }) => [styles.slot, pressed && { opacity: 0.7 }]}
              >
                <Text style={styles.slotText}>{slot}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {listing.category === 'groceries' && (
          <View style={styles.deliveryBadge}>
            <Ionicons name="bicycle-outline" size={12} color={colors.primary} />
            <Text style={styles.deliveryText}>Free delivery on $40+</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.sm,
  },
  cardH: { width: 260 },
  imageWrap: { position: 'relative', height: 150 },
  image: { width: '100%', height: '100%' },
  heartBtn: {
    position: 'absolute', top: 10, right: 10,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.92)',
    alignItems: 'center', justifyContent: 'center',
  },
  categoryBadge: {
    position: 'absolute', top: 10, left: 10,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20,
  },
  categoryText: { fontSize: 11, fontWeight: '700', color: colors.dark },
  body: { padding: 12 },
  titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 2 },
  name: { flex: 1, fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginRight: 8 },
  price: { fontSize: 13, fontWeight: '500', color: colors.textMuted },
  cuisine: { fontSize: 12, color: colors.textMuted, marginBottom: 8 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 10, flexWrap: 'wrap' },
  rating: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  reviewCount: { fontSize: 12, color: colors.textMuted },
  dot: { width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textLight },
  metaText: { fontSize: 12, color: colors.textMuted },
  slots: { marginBottom: 2 },
  slot: {
    backgroundColor: colors.primaryPale,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: radius.md,
  },
  slotText: { fontSize: 12, fontWeight: '700', color: colors.primary },
  deliveryBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  deliveryText: { fontSize: 11, color: colors.primary, fontWeight: '600' },
})
