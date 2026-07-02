import React, { useState, useEffect } from 'react'
import { View, ScrollView, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withDelay, withTiming, Easing } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useDriver } from '../context/DriverContext'
import { quests as questSeed, Quest, peakWindow } from '../data/mock'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'
import PowerToggle from '../components/PowerToggle'

function QuestBar({ progress, target, color, trackColor, index }: { progress: number; target: number; color: string; trackColor: string; index: number }) {
  const grow = useSharedValue(0)
  const pct = Math.min(progress / target, 1)

  useEffect(() => {
    grow.value = withDelay(200 + index * 90, withTiming(pct, { duration: 650, easing: Easing.out(Easing.cubic) }))
  }, [])

  const style = useAnimatedStyle(() => ({ width: `${grow.value * 100}%` }))

  return (
    <View style={[bar.track, { backgroundColor: trackColor }]}>
      <Animated.View style={[bar.fill, style, { backgroundColor: color }]} />
    </View>
  )
}

const bar = StyleSheet.create({
  track: { height: 8, borderRadius: 4, overflow: 'hidden' },
  fill: { height: 8, borderRadius: 4 },
})

export default function DiscoverScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const { destination, toggleDestination } = useDriver()
  const [quests, setQuests] = useState<Quest[]>(questSeed)

  const joinQuest = (id: string) => setQuests(prev => prev.map(q => (q.id === id ? { ...q, joined: true } : q)))

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <AppText variant="h1" style={{ color: colors.textPrimary }}>Discover</AppText>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Destination filter */}
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.destCard}>
          <View style={styles.destIcon}>
            <Ionicons name="home-outline" size={18} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>Destination filter</AppText>
            <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
              {destination.active ? `Only jobs heading toward ${destination.address}` : 'Get only jobs heading toward a set address'}
            </AppText>
          </View>
          <PowerToggle value={destination.active} onChange={toggleDestination} activeColor={colors.primary} activeGlow={colors.primaryLight} trackOff={colors.surfaceAlt} />
        </Animated.View>

        {/* Peak hours promo strip */}
        <Animated.View entering={FadeInDown.delay(70).springify().damping(16)} style={styles.peakStrip}>
          <Ionicons name="flame" size={16} color={colors.amber} />
          <AppText variant="bodySemi" style={{ color: colors.textPrimary, flex: 1, marginLeft: 8 }}>
            Peak demand tonight {peakWindow}
          </AppText>
          <AppText variant="label" style={{ color: colors.amber, fontSize: 10 }}>Boost+</AppText>
        </Animated.View>

        <View style={styles.sectionHeader}>
          <View style={[styles.sectionBar, { backgroundColor: colors.primary }]} />
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Quests</AppText>
        </View>

        {quests.map((q, i) => (
          <Animated.View key={q.id} entering={FadeInDown.delay(120 + i * 80).springify().damping(16)} style={styles.questCard}>
            <View style={styles.questTop}>
              <View style={{ flex: 1 }}>
                <AppText variant="h3" style={{ color: colors.textPrimary }}>{q.title}</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 3, lineHeight: 17 }}>{q.desc}</AppText>
              </View>
              <View style={styles.rewardChip}>
                <AppText variant="num" style={{ color: colors.primary, fontSize: 17 }}>+${q.reward}</AppText>
              </View>
            </View>

            {q.joined ? (
              <>
                <QuestBar progress={q.progress} target={q.target} color={colors.primary} trackColor={colors.surfaceAlt} index={i} />
                <View style={styles.questFooter}>
                  <AppText variant="caption" style={{ color: colors.textMuted }}>{q.progress} of {q.target} deliveries</AppText>
                  <AppText variant="label" style={{ color: colors.textLight, fontSize: 9.5 }}>{q.expires}</AppText>
                </View>
              </>
            ) : (
              <View style={styles.questFooter}>
                <AppText variant="label" style={{ color: colors.textLight, fontSize: 9.5 }}>{q.expires}</AppText>
                <Tappable onPress={() => joinQuest(q.id)} style={[styles.joinBtn, { backgroundColor: colors.primary }]}>
                  <AppText variant="bodyBold" style={{ color: colors.white, fontSize: 13 }}>Sign up</AppText>
                </Tappable>
              </View>
            )}
          </Animated.View>
        ))}

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  content: { padding: spacing.md },

  destCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border,
    padding: spacing.md, marginBottom: 12,
  },
  destIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },

  peakStrip: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surfaceAlt, ...cut.chip, borderWidth: 1, borderColor: colors.border,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: spacing.md,
  },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14, marginTop: 6 },
  sectionBar: { width: 4, height: 16, borderRadius: 2 },

  questCard: { backgroundColor: colors.surface, ...cut.card, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 12 },
  questTop: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  rewardChip: { backgroundColor: colors.primaryPale, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  questFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 },
  joinBtn: { borderRadius: 100, paddingHorizontal: 18, paddingVertical: 9 },
})
