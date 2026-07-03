import React from 'react'
import { View, StyleSheet, Switch } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { MenuItem } from '../data/mock'
import { Palette } from '../context/ThemeContext'
import { cut } from '../theme'
import AppText from './AppText'
import Tappable from './Tappable'

interface Props {
  item: MenuItem
  index: number
  colors: Palette
  onToggle: (id: string, available: boolean) => void
  onPress: () => void
}

export default function MenuItemCard({ item, index, colors, onToggle, onPress }: Props) {
  return (
    <Animated.View entering={FadeInDown.delay(index * 40).springify().damping(16)}>
      <Tappable onPress={onPress} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, opacity: item.available ? 1 : 0.6 }]}>
        <View style={styles.left}>
          <View style={[styles.iconBox, { backgroundColor: colors.primaryPale }]}>
            <Ionicons name="restaurant" size={16} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodySemi" style={{ color: colors.textPrimary }} numberOfLines={1}>{item.name}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }} numberOfLines={1}>{item.description}</AppText>
            <View style={styles.meta}>
              <View style={[styles.catChip, { backgroundColor: colors.surfaceAlt }]}>
                <AppText variant="label" style={{ fontSize: 9, color: colors.textLight, letterSpacing: 0.5 }}>{item.category}</AppText>
              </View>
              {item.soldToday > 0 && (
                <AppText variant="caption" style={{ color: colors.textLight, fontSize: 11 }}>{item.soldToday} sold today</AppText>
              )}
            </View>
          </View>
        </View>
        <View style={styles.right}>
          <AppText variant="num" style={{ color: colors.textPrimary, fontSize: 15, marginBottom: 6 }}>${item.price.toFixed(2)}</AppText>
          <Switch
            value={item.available}
            onValueChange={v => onToggle(item.id, v)}
            trackColor={{ false: colors.border, true: colors.primaryBorder }}
            thumbColor={item.available ? colors.primary : colors.textLight}
            style={{ transform: [{ scaleX: 0.85 }, { scaleY: 0.85 }] }}
          />
        </View>
      </Tappable>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  card: {
    ...cut.chip,
    borderWidth: 1,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  left: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 5 },
  catChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 100 },
  right: { alignItems: 'center', gap: 2 },
})
