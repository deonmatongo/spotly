import React, { useState } from 'react'
import {
  View, ScrollView, StyleSheet, TextInput,
  KeyboardAvoidingView, Platform, Pressable, Switch,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { MenuCategory } from '../data/mock'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

const CATEGORIES: MenuCategory[] = ['Mains', 'Starters', 'Sides', 'Drinks', 'Desserts']

export default function AddItemScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<MenuCategory>('Mains')
  const [available, setAvailable] = useState(true)

  const canSave = name.trim().length > 0 && parseFloat(price) > 0

  const handleSave = () => {
    if (!canSave) return
    nav.goBack()
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Ionicons name="close" size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h2" style={{ color: colors.textPrimary, flex: 1 }}>Add menu item</AppText>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

          <Animated.View entering={FadeInDown.springify().damping(16)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label" style={{ color: colors.textLight, marginBottom: 14 }}>Item details</AppText>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>Name *</AppText>
              <TextInput
                value={name}
                onChangeText={setName}
                placeholder="e.g. Grilled Tilapia"
                placeholderTextColor={colors.textLight}
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>Price (USD) *</AppText>
              <TextInput
                value={price}
                onChangeText={setPrice}
                placeholder="0.00"
                placeholderTextColor={colors.textLight}
                keyboardType="decimal-pad"
                style={[styles.input, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
            </View>

            <View style={styles.fieldGroup}>
              <AppText variant="caption" style={[styles.fieldLabel, { color: colors.textMuted }]}>Description</AppText>
              <TextInput
                value={description}
                onChangeText={setDescription}
                placeholder="Short description of the dish…"
                placeholderTextColor={colors.textLight}
                multiline
                numberOfLines={3}
                style={[styles.input, styles.textArea, { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}
              />
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(60).springify().damping(16)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <AppText variant="label" style={{ color: colors.textLight, marginBottom: 14 }}>Category</AppText>
            <View style={styles.catRow}>
              {CATEGORIES.map(cat => {
                const active = category === cat
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setCategory(cat)}
                    style={[styles.catChip, { borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primaryPale : colors.surfaceAlt }]}
                  >
                    <AppText variant="bodySemi" style={{ color: active ? colors.primary : colors.textLight, fontSize: 13 }}>{cat}</AppText>
                  </Pressable>
                )
              })}
            </View>
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(100).springify().damping(16)} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Available now</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 3 }}>Customers can order this item immediately</AppText>
              </View>
              <Switch
                value={available}
                onValueChange={setAvailable}
                trackColor={{ false: colors.border, true: colors.primaryBorder }}
                thumbColor={available ? colors.primary : colors.textLight}
              />
            </View>
          </Animated.View>

          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <Tappable
          onPress={handleSave}
          disabled={!canSave}
          style={[styles.saveBtn, { backgroundColor: canSave ? colors.primary : colors.border }]}
        >
          <Ionicons name="checkmark-circle" size={18} color={canSave ? '#fff' : colors.textLight} />
          <AppText variant="bodyBold" style={{ color: canSave ? '#fff' : colors.textLight, fontSize: 15 }}>Save item</AppText>
        </Tappable>
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  content: { padding: spacing.md },
  card: { ...cut.card, borderWidth: 1, padding: spacing.md, marginBottom: spacing.md },

  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { marginBottom: 8 },
  input: {
    borderWidth: 1.3, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontFamily: 'Manrope_500Medium', fontSize: 15,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', paddingTop: 12 },

  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catChip: { borderWidth: 1.3, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    borderTopWidth: 1, paddingHorizontal: spacing.md, paddingTop: 14, paddingBottom: 32,
  },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 10, paddingVertical: 16, borderRadius: 100,
  },
})
