import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { LinearGradient } from 'expo-linear-gradient'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius, shadow } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { offers, Offer } from '../data/mock'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function OffersScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const [copied, setCopied] = useState<string | null>(null)

  const copyCode = (o: Offer) => {
    setCopied(o.code)
    setTimeout(() => setCopied(c => (c === o.code ? null : c)), 1800)
  }

  const goShop = (o: Offer) => {
    const cat = o.category === 'all' ? undefined : o.category
    ;(nav as any).navigate('MainTabs', { screen: 'Search', params: cat ? { category: cat } : undefined })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Offers & Promos</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>Tap a code to copy, then apply it at checkout.</Text>

        {offers.map(o => (
          <LinearGradient key={o.id} colors={o.colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <View style={styles.cardTop}>
              <View style={styles.iconWrap}>
                <Ionicons name={o.icon as any} size={22} color={colors.white} />
              </View>
              <View style={styles.expiryPill}><Text style={styles.expiryText}>{o.expires}</Text></View>
            </View>

            <Text style={styles.title}>{o.title}</Text>
            <Text style={styles.blurb}>{o.detail}</Text>

            <View style={styles.codeRow}>
              <Pressable style={styles.codeChip} onPress={() => copyCode(o)}>
                <Ionicons name={copied === o.code ? 'checkmark' : 'copy-outline'} size={14} color={colors.white} />
                <Text style={styles.codeText}>{copied === o.code ? 'Copied!' : o.code}</Text>
              </Pressable>
              <Pressable style={styles.shopBtn} onPress={() => goShop(o)}>
                <Text style={styles.shopText}>Use now</Text>
                <Ionicons name="arrow-forward" size={13} color={o.colors[1]} />
              </Pressable>
            </View>
          </LinearGradient>
        ))}

        <View style={styles.note}>
          <Ionicons name="information-circle-outline" size={16} color={colors.textMuted} />
          <Text style={styles.noteText}>One promo code per order. Discounts apply to eligible items only.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  topTitle: { fontSize: 17, fontWeight: '700', color: colors.textPrimary },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.md },
  intro: { fontSize: 13, color: colors.textMuted, marginBottom: 16 },
  card: { borderRadius: radius.xl, padding: spacing.md, marginBottom: 14, ...shadow.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  expiryPill: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: radius.full, paddingHorizontal: 10, paddingVertical: 5 },
  expiryText: { fontSize: 11, fontWeight: '700', color: colors.white },
  title: { fontSize: 20, fontWeight: '800', color: colors.white, marginBottom: 6, letterSpacing: -0.3 },
  blurb: { fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 19, marginBottom: 16 },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  codeChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.6)', borderRadius: radius.md, paddingHorizontal: 12, paddingVertical: 9 },
  codeText: { fontSize: 14, fontWeight: '800', color: colors.white, letterSpacing: 1 },
  shopBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, marginLeft: 'auto', backgroundColor: colors.white, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 9 },
  shopText: { fontSize: 13, fontWeight: '700', color: colors.dark },
  note: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, padding: 12, marginTop: 4 },
  noteText: { flex: 1, fontSize: 12, color: colors.textMuted, lineHeight: 18 },
})
