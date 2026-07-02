import React from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import AppText from '../components/AppText'
import useCountUp from '../hooks/useCountUp'

type Route = RouteProp<RootStackParamList, 'FareBreakdown'>

export default function FareBreakdownScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const { fare } = useRoute<Route>().params
  const total = fare.base + fare.surgeAmt + fare.boost + fare.tip
  const animatedTotal = useCountUp(total, 700)

  const lines = [
    { label: 'Base fare', value: fare.base, always: true },
    { label: 'Surge multiplier', value: fare.surgeAmt },
    { label: 'Promo boost', value: fare.boost },
    { label: 'Customer tip', value: fare.tip },
  ].filter(l => l.always || l.value > 0)

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h3" style={{ color: colors.textPrimary }}>Trip receipt</AppText>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.receipt}>
          <View style={styles.receiptHead}>
            <AppText variant="h2" style={{ color: colors.textPrimary }}>{fare.vendorName}</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>{fare.route}</AppText>
            <AppText variant="caption" style={{ color: colors.textLight, marginTop: 2 }}>{fare.completedAt}</AppText>
          </View>

          <View style={styles.tearLine}>
            {Array.from({ length: 18 }).map((_, i) => <View key={i} style={styles.tearDash} />)}
          </View>

          {lines.map(line => (
            <View key={line.label} style={styles.line}>
              <AppText variant="body" style={{ color: colors.textMuted }}>{line.label}</AppText>
              <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>${line.value.toFixed(2)}</AppText>
            </View>
          ))}

          <View style={styles.totalRow}>
            <AppText variant="h3" style={{ color: colors.textPrimary }}>Total earned</AppText>
            <AppText variant="num" style={{ color: colors.primary, fontSize: 28 }}>${animatedTotal.toFixed(2)}</AppText>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(16)} style={styles.note}>
          <Ionicons name="information-circle-outline" size={15} color={colors.textMuted} />
          <AppText variant="caption" style={{ color: colors.textMuted, flex: 1, lineHeight: 17 }}>
            Earnings settle into your pending balance immediately and pay out weekly — or cash out instantly from the Earnings tab.
          </AppText>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  content: { padding: spacing.md },

  receipt: { backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.lg },
  receiptHead: { alignItems: 'center' },
  tearLine: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 18 },
  tearDash: { width: 10, height: 1.5, backgroundColor: colors.divider },
  line: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: colors.divider },

  note: { flexDirection: 'row', gap: 8, padding: spacing.md, alignItems: 'flex-start' },
})
