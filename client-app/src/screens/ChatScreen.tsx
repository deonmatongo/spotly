import React, { useRef, useState } from 'react'
import {
  View, ScrollView, StyleSheet, Pressable, TextInput,
  KeyboardAvoidingView, Platform,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native'
import { Linking } from 'react-native'
import Animated, { FadeInUp } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

type Route = RouteProp<RootStackParamList, 'Chat'>

interface Msg { id: string; from: 'you' | 'driver'; text: string; time: string }

const QUICK_REPLIES = [
  "Where are you now?",
  "Please leave it at the gate",
  "I'm coming down",
  "Thank you! 🙏",
]

// Canned driver replies keyed loosely to keep the demo lively.
const DRIVER_REPLIES = [
  "On my way — about 5 minutes out 🛵",
  "Sure thing, I'll leave it at the gate.",
  "Just turned onto your road!",
  "No problem 👍",
]

export default function ChatScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const route = useRoute<Route>()
  const driverName = route.params?.driverName || 'Your rider'
  const phone = route.params?.phone || '+263771234567'

  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm1', from: 'driver', text: `Hi! This is ${driverName}, I've got your order 🎒`, time: 'now' },
  ])
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<ScrollView>(null)
  const replyIdx = useRef(0)

  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    const you: Msg = { id: `y${Date.now()}`, from: 'you', text: t, time: 'now' }
    setMessages(prev => [...prev, you])
    setDraft('')
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    // Simulated driver reply.
    setTimeout(() => {
      const reply = DRIVER_REPLIES[replyIdx.current % DRIVER_REPLIES.length]
      replyIdx.current += 1
      setMessages(prev => [...prev, { id: `d${Date.now()}`, from: 'driver', text: reply, time: 'now' }])
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50)
    }, 1400)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <AppText variant="bodyBold" style={{ color: '#fff' }}>{driverName.charAt(0)}</AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="h3" style={{ color: colors.textPrimary }}>{driverName}</AppText>
          <AppText variant="caption" style={{ color: colors.primary }}>● Online · your rider</AppText>
        </View>
        <Pressable onPress={() => Linking.openURL(`tel:${phone}`)} hitSlop={10} style={[styles.callBtn, { backgroundColor: colors.primaryPale }]}>
          <Ionicons name="call" size={17} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.thread} showsVerticalScrollIndicator={false}>
          {messages.map(m => (
            <Animated.View key={m.id} entering={FadeInUp.duration(200)} style={[styles.bubbleRow, m.from === 'you' ? styles.rowYou : styles.rowDriver]}>
              <View style={[styles.bubble, m.from === 'you'
                ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                : { backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderBottomLeftRadius: 4 }]}>
                <AppText variant="body" style={{ color: m.from === 'you' ? '#fff' : colors.textPrimary, fontSize: 14 }}>{m.text}</AppText>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        {/* Quick replies */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
          {QUICK_REPLIES.map(q => (
            <Tappable key={q} onPress={() => send(q)} style={[styles.quickChip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <AppText variant="caption" style={{ color: colors.textSecondary }}>{q}</AppText>
            </Tappable>
          ))}
        </ScrollView>

        {/* Composer */}
        <View style={[styles.composer, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message your rider…"
            placeholderTextColor={colors.textLight}
            style={[styles.input, { color: colors.textPrimary, backgroundColor: colors.surfaceAlt }]}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
          />
          <Tappable onPress={() => send(draft)} style={[styles.sendBtn, { backgroundColor: draft.trim() ? colors.primary : colors.border }]}>
            <Ionicons name="arrow-up" size={20} color="#fff" />
          </Tappable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  avatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },

  thread: { padding: spacing.md, gap: 10, flexGrow: 1, justifyContent: 'flex-end' },
  bubbleRow: { flexDirection: 'row' },
  rowYou: { justifyContent: 'flex-end' },
  rowDriver: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18 },

  quickScroll: { maxHeight: 48, borderTopWidth: 1, borderTopColor: colors.divider },
  quickContent: { paddingHorizontal: spacing.md, paddingVertical: 8, gap: 8 },
  quickChip: { borderWidth: 1, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },

  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: 10, paddingBottom: 6, borderTopWidth: 1 },
  input: { flex: 1, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 11, fontFamily: 'Manrope_500Medium', fontSize: 14.5, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
})
