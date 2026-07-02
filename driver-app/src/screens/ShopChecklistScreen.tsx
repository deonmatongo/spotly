import React, { useState } from 'react'
import { View, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useJobs } from '../context/JobsContext'
import { plusCard } from '../data/mock'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

type ItemState = 'pending' | 'picked' | 'sub' | 'refund'

export default function ShopChecklistScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const { activeJob } = useJobs()
  const items = activeJob?.groceryItems ?? []
  const [states, setStates] = useState<Record<string, ItemState>>({})
  const [subOpen, setSubOpen] = useState<string | null>(null)
  const [chosenSubs, setChosenSubs] = useState<Record<string, string>>({})

  const resolved = items.filter(i => (states[i.id] ?? 'pending') !== 'pending').length
  const allDone = items.length > 0 && resolved === items.length

  const pick = (id: string) => {
    setStates(prev => ({ ...prev, [id]: prev[id] === 'picked' ? 'pending' : 'picked' }))
    setSubOpen(null)
  }

  const chooseSub = (id: string, sub: string) => {
    setChosenSubs(prev => ({ ...prev, [id]: sub }))
    setStates(prev => ({ ...prev, [id]: 'sub' }))
    setSubOpen(null)
  }

  const refund = (id: string) => {
    setStates(prev => ({ ...prev, [id]: 'refund' }))
    setSubOpen(null)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h3" style={{ color: colors.textPrimary }}>Shopping list</AppText>
        <View style={[styles.countChip, { backgroundColor: colors.primaryPale }]}>
          <AppText variant="bodyBold" style={{ color: colors.primary, fontSize: 12 }}>{resolved}/{items.length}</AppText>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {items.map((item, i) => {
          const state = states[item.id] ?? 'pending'
          const open = subOpen === item.id
          return (
            <Animated.View key={item.id} entering={FadeInDown.delay(i * 60).springify().damping(16)} style={[styles.itemCard, state === 'picked' && { borderColor: colors.primaryBorder }]}>
              <Pressable onPress={() => pick(item.id)} style={styles.itemRow}>
                <View style={[styles.checkbox, state === 'picked' && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
                  {state === 'picked' && <Ionicons name="checkmark" size={14} color={colors.white} />}
                  {state === 'sub' && <Ionicons name="swap-horizontal" size={13} color={colors.amber} />}
                  {state === 'refund' && <Ionicons name="close" size={13} color={colors.red} />}
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodyBold" style={{ color: colors.textPrimary, textDecorationLine: state === 'refund' ? 'line-through' : 'none' }}>
                    {item.name}
                  </AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                    {state === 'sub' ? `Substituted → ${chosenSubs[item.id]}` : state === 'refund' ? 'Refunded to customer' : `Qty ${item.qty}`}
                  </AppText>
                </View>
                {state === 'pending' && (
                  <Pressable onPress={() => setSubOpen(open ? null : item.id)} style={styles.oosBtn}>
                    <AppText variant="bodySemi" style={{ color: colors.amber, fontSize: 11.5 }}>Out of stock?</AppText>
                  </Pressable>
                )}
              </Pressable>

              {open && (
                <Animated.View entering={FadeIn.duration(180)} style={styles.subPanel}>
                  <AppText variant="label" style={{ color: colors.textMuted, marginBottom: 8 }}>Suggest a substitution</AppText>
                  {item.subs.map(sub => (
                    <Pressable key={sub} onPress={() => chooseSub(item.id, sub)} style={styles.subOption}>
                      <Ionicons name="swap-horizontal-outline" size={15} color={colors.primary} />
                      <AppText variant="body" style={{ color: colors.textPrimary, flex: 1 }}>{sub}</AppText>
                    </Pressable>
                  ))}
                  <View style={styles.subActions}>
                    <Pressable onPress={() => (nav as any).navigate('Chat')} style={styles.subActionBtn}>
                      <Ionicons name="chatbubble-outline" size={14} color={colors.primary} />
                      <AppText variant="bodySemi" style={{ color: colors.primary, fontSize: 12.5 }}>Ask customer</AppText>
                    </Pressable>
                    <Pressable onPress={() => refund(item.id)} style={styles.subActionBtn}>
                      <Ionicons name="return-down-back-outline" size={14} color={colors.red} />
                      <AppText variant="bodySemi" style={{ color: colors.red, fontSize: 12.5 }}>Refund item</AppText>
                    </Pressable>
                  </View>
                </Animated.View>
              )}
            </Animated.View>
          )
        })}

        {/* Plus Card payment */}
        <Animated.View entering={FadeInDown.delay(items.length * 60 + 80).springify().damping(16)} style={styles.plusCard}>
          <View style={styles.plusCardTop}>
            <AppText variant="label" style={{ color: 'rgba(255,255,255,0.8)' }}>Spotly Plus Card</AppText>
            <Ionicons name="card" size={18} color={colors.white} />
          </View>
          <AppText variant="num" style={{ color: colors.white, fontSize: 26, marginTop: 8 }}>${plusCard.balance.toFixed(2)}</AppText>
          <AppText variant="caption" style={{ color: 'rgba(255,255,255,0.75)', marginTop: 4 }}>
            Pay at the till with card •••• {plusCard.last4}
          </AppText>
        </Animated.View>

        <View style={{ height: 110 }} />
      </ScrollView>

      <View style={styles.ctaWrap}>
        <Tappable
          onPress={() => nav.goBack()}
          style={[styles.doneBtn, { backgroundColor: allDone ? colors.primary : colors.surfaceAlt }]}
          disabled={!allDone}
        >
          <AppText variant="bodyBold" style={{ color: allDone ? colors.white : colors.textLight, fontSize: 15 }}>
            {allDone ? 'Shopping complete' : `Resolve ${items.length - resolved} more item${items.length - resolved === 1 ? '' : 's'}`}
          </AppText>
        </Tappable>
      </View>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  countChip: { minWidth: 44, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 },
  content: { padding: spacing.md },

  itemCard: { backgroundColor: colors.surface, ...cut.chip, borderWidth: 1, borderColor: colors.border, marginBottom: 10, overflow: 'hidden' },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: spacing.md },
  checkbox: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  oosBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 100, backgroundColor: 'rgba(245,158,11,0.14)' },

  subPanel: { borderTopWidth: 1, borderTopColor: colors.divider, padding: spacing.md, paddingTop: 12 },
  subOption: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 9 },
  subActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  subActionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.surfaceAlt, borderRadius: 100, paddingVertical: 10 },

  plusCard: { backgroundColor: colors.dark, ...cut.card, padding: spacing.md, marginTop: 6 },
  plusCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md, paddingBottom: spacing.lg },
  doneBtn: { borderRadius: 30, paddingVertical: 16, alignItems: 'center' },
})
