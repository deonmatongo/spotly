import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import Animated, { FadeIn } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { MenuItem, MenuCategory } from '../data/mock'
import { useMenu } from '../context/MenuContext'
import { RootStackParamList } from '../navigation'
import MenuItemCard from '../components/MenuItemCard'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

type Nav = NativeStackNavigationProp<RootStackParamList>

const CATEGORIES: Array<MenuCategory | 'All'> = ['All', 'Mains', 'Starters', 'Sides', 'Drinks', 'Desserts']

export default function MenuScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const { items, toggleAvailability } = useMenu()
  const [category, setCategory] = useState<MenuCategory | 'All'>('All')

  const filtered = category === 'All' ? items : items.filter(i => i.category === category)
  const availableCount = items.filter(i => i.available).length

  const toggleItem = (id: string, available: boolean) => toggleAvailability(id, available)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <View style={{ flex: 1 }}>
          <AppText variant="h1" style={{ color: colors.textPrimary }}>Menu</AppText>
          <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{availableCount} of {items.length} items available</AppText>
        </View>
        <Tappable onPress={() => nav.navigate('AddItem')} style={[styles.addBtn, { backgroundColor: colors.primary }]}>
          <Ionicons name="add" size={18} color="#fff" />
          <AppText variant="bodySemi" style={{ color: '#fff', fontSize: 13 }}>Add item</AppText>
        </Tappable>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {CATEGORIES.map(cat => {
          const active = category === cat
          return (
            <Pressable
              key={cat}
              onPress={() => setCategory(cat)}
              style={[styles.filterChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryPale : colors.surface }]}
            >
              <AppText variant="bodySemi" style={{ color: active ? colors.primary : colors.textLight, fontSize: 13 }}>{cat}</AppText>
            </Pressable>
          )
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {filtered.length === 0 ? (
          <Animated.View entering={FadeIn.delay(100)} style={[styles.empty, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
            <Ionicons name="restaurant-outline" size={30} color={colors.textLight} />
            <AppText variant="h3" style={{ color: colors.textPrimary, marginTop: 12 }}>No items in this category</AppText>
          </Animated.View>
        ) : (
          filtered.map((item, i) => (
            <MenuItemCard
              key={item.id}
              item={item}
              index={i}
              colors={colors}
              onToggle={toggleItem}
              onPress={() => nav.navigate('EditItem', { item })}
            />
          ))
        )}
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 100 },

  filterScroll: { borderBottomWidth: 1, borderBottomColor: colors.border },
  filterContent: { paddingHorizontal: spacing.md, paddingVertical: 10, gap: 8 },
  filterChip: { borderWidth: 1.3, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },

  content: { padding: spacing.md },
  empty: { alignItems: 'center', padding: spacing.xl, ...cut.cardFlip, borderWidth: 1, borderStyle: 'dashed' },
})
