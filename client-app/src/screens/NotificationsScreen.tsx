import React, { useEffect } from 'react'
import { View, Text, ScrollView, Pressable, StyleSheet } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { useNotifications, notifIcon, notifTint, AppNotification } from '../context/NotificationsContext'

type Nav = NativeStackNavigationProp<RootStackParamList>

export default function NotificationsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const { notifications, markAllRead, markRead, clearAll, unreadCount } = useNotifications()

  // Mark everything read shortly after opening (so the badge clears)
  useEffect(() => {
    const t = setTimeout(markAllRead, 1200)
    return () => clearTimeout(t)
  }, [])

  const onTap = (n: AppNotification) => {
    markRead(n.id)
    if (n.type === 'offer') (nav as any).navigate('Offers')
    else if (n.type === 'ticket') (nav as any).navigate('MyTickets')
    else if (n.type === 'booking' || n.type === 'reminder') (nav as any).navigate('MainTabs', { screen: 'Bookings' })
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.topTitle}>Notifications</Text>
        {notifications.length > 0 ? (
          <Pressable onPress={clearAll} hitSlop={8}><Text style={styles.clear}>Clear</Text></Pressable>
        ) : <View style={{ width: 36 }} />}
      </View>

      {notifications.length === 0 ? (
        <View style={styles.empty}>
          <View style={styles.emptyIcon}><Ionicons name="notifications-off-outline" size={44} color={colors.textLight} /></View>
          <Text style={styles.emptyTitle}>You're all caught up</Text>
          <Text style={styles.emptySub}>New booking, ticket and offer updates will show up here.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]} showsVerticalScrollIndicator={false}>
          {unreadCount > 0 && (
            <View style={styles.headerRow}>
              <Text style={styles.unreadLabel}>{unreadCount} new</Text>
              <Pressable onPress={markAllRead} hitSlop={6}><Text style={styles.markRead}>Mark all read</Text></Pressable>
            </View>
          )}
          {notifications.map(n => (
            <Pressable key={n.id} onPress={() => onTap(n)} style={[styles.row, !n.read && styles.rowUnread]}>
              <View style={[styles.iconWrap, { backgroundColor: notifTint(n.type) + '1A' }]}>
                <Ionicons name={notifIcon(n.type)} size={20} color={notifTint(n.type)} />
              </View>
              <View style={styles.body}>
                <View style={styles.titleRow}>
                  <Text style={styles.title} numberOfLines={1}>{n.title}</Text>
                  {!n.read && <View style={styles.dot} />}
                </View>
                <Text style={styles.text}>{n.body}</Text>
                <Text style={styles.time}>{n.time}</Text>
              </View>
            </Pressable>
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
  clear: { fontSize: 14, fontWeight: '600', color: colors.red },
  content: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  unreadLabel: { fontSize: 13, fontWeight: '700', color: colors.primary },
  markRead: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  row: { flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 12, borderRadius: radius.lg, marginBottom: 8, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  rowUnread: { backgroundColor: colors.primaryPale, borderColor: colors.primaryBorder },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  title: { flex: 1, fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary },
  text: { fontSize: 13, color: colors.textMuted, lineHeight: 19, marginTop: 2 },
  time: { fontSize: 11, color: colors.textLight, marginTop: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: spacing.xl },
  emptyIcon: { width: 88, height: 88, borderRadius: 44, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  emptySub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', paddingHorizontal: 24, lineHeight: 20 },
})
