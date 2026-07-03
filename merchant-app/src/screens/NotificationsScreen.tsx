import React, { useState } from 'react'
import { View, ScrollView, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { notificationsSeed, MerchantNotification } from '../data/mock'
import AppText from '../components/AppText'

const TYPE_META: Record<MerchantNotification['type'], { icon: string; color: string }> = {
  order: { icon: 'receipt', color: '#F97316' },
  review: { icon: 'star', color: '#F59E0B' },
  payout: { icon: 'wallet', color: '#22C55E' },
  system: { icon: 'megaphone', color: '#3B82F6' },
}

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const [notifs, setNotifs] = useState<MerchantNotification[]>(notificationsSeed)

  const markAllRead = () => setNotifs(prev => prev.map(n => ({ ...n, read: true })))
  const unread = notifs.filter(n => !n.read).length

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <AppText variant="h1" style={{ color: colors.textPrimary, flex: 1 }}>Notifications</AppText>
        {unread > 0 && (
          <Pressable onPress={markAllRead}>
            <AppText variant="caption" style={{ color: colors.primary }}>Mark all read</AppText>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {notifs.map((notif, i) => {
          const meta = TYPE_META[notif.type]
          return (
            <Animated.View key={notif.id} entering={FadeInDown.delay(i * 50).springify().damping(16)}>
              <Pressable
                onPress={() => setNotifs(prev => prev.map(n => n.id === notif.id ? { ...n, read: true } : n))}
                style={[styles.notifRow, { backgroundColor: notif.read ? colors.surface : colors.surfaceAlt, borderColor: notif.read ? colors.border : colors.primary + '44' }]}
              >
                {!notif.read && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
                <View style={[styles.iconWrap, { backgroundColor: meta.color + '22' }]}>
                  <Ionicons name={meta.icon as any} size={17} color={meta.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <AppText variant="bodySemi" style={{ color: colors.textPrimary }}>{notif.title}</AppText>
                  <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 3, lineHeight: 17 }}>{notif.body}</AppText>
                  <AppText variant="label" style={{ color: colors.textLight, fontSize: 9.5, marginTop: 5 }}>{notif.time}</AppText>
                </View>
              </Pressable>
            </Animated.View>
          )
        })}
        <View style={{ height: 60 }} />
      </ScrollView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  content: { padding: spacing.md },
  notifRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    ...cut.chip, borderWidth: 1, padding: 14, marginBottom: 10, position: 'relative',
  },
  unreadDot: { position: 'absolute', top: 10, right: 10, width: 7, height: 7, borderRadius: 4 },
  iconWrap: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
})
