import React, { useState, useRef, useEffect } from 'react'
import { View, ScrollView, Pressable, StyleSheet, TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated'
import { spacing, fonts } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { useJobs } from '../context/JobsContext'
import { chatSeed, chatQuickReplies, ChatMessage } from '../data/mock'
import AppText from '../components/AppText'

let msgId = 100

export default function ChatScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const { activeJob } = useJobs()
  const [messages, setMessages] = useState<ChatMessage[]>(chatSeed)
  const [draft, setDraft] = useState('')
  const scrollRef = useRef<ScrollView>(null)

  const customerName = activeJob?.customerName ?? 'Customer'

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true })
  }, [messages])

  const send = (text: string) => {
    const t = text.trim()
    if (!t) return
    setMessages(prev => [...prev, { id: `m${msgId++}`, from: 'driver', text: t, time: 'Now' }])
    setDraft('')
    // Canned customer echo so the thread feels alive in the prototype.
    setTimeout(() => {
      setMessages(prev => [...prev, { id: `m${msgId++}`, from: 'customer', text: 'Great, thank you! 🙏', time: 'Now' }])
    }, 1600)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, alignItems: 'center' }}>
          <AppText variant="h3" style={{ color: colors.textPrimary }}>{customerName}</AppText>
          <View style={styles.maskedRow}>
            <Ionicons name="shield-checkmark" size={10} color={colors.primary} />
            <AppText variant="caption" style={{ color: colors.textMuted, fontSize: 10.5 }}>Numbers are masked for privacy</AppText>
          </View>
        </View>
        <Pressable style={styles.callBtn}>
          <Ionicons name="call-outline" size={18} color={colors.primary} />
        </Pressable>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView ref={scrollRef} contentContainerStyle={styles.thread} showsVerticalScrollIndicator={false}>
          {messages.map(m => (
            <Animated.View
              key={m.id}
              entering={m.from === 'driver' ? FadeInUp.springify().damping(16) : FadeInDown.springify().damping(16)}
              style={[styles.bubble, m.from === 'driver' ? styles.bubbleMine : styles.bubbleTheirs]}
            >
              <AppText variant="body" style={{ color: m.from === 'driver' ? colors.white : colors.textPrimary }}>{m.text}</AppText>
              <AppText variant="caption" style={{ color: m.from === 'driver' ? 'rgba(255,255,255,0.6)' : colors.textLight, fontSize: 10, marginTop: 4, alignSelf: 'flex-end' }}>{m.time}</AppText>
            </Animated.View>
          ))}
        </ScrollView>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRow} keyboardShouldPersistTaps="handled">
          {chatQuickReplies.map(q => (
            <Pressable key={q} onPress={() => send(q)} style={styles.quickChip}>
              <AppText variant="bodySemi" style={{ color: colors.primary, fontSize: 12.5 }}>{q}</AppText>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Message…"
            placeholderTextColor={colors.textLight}
            style={styles.input}
            onSubmitEditing={() => send(draft)}
            returnKeyType="send"
          />
          <Pressable onPress={() => send(draft)} style={[styles.sendBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="arrow-up" size={18} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.primaryPale, alignItems: 'center', justifyContent: 'center' },
  maskedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },

  thread: { padding: spacing.md, gap: 10 },
  bubble: { maxWidth: '80%', paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: {
    alignSelf: 'flex-end', backgroundColor: colors.primary,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomLeftRadius: 18, borderBottomRightRadius: 4,
  },
  bubbleTheirs: {
    alignSelf: 'flex-start', backgroundColor: colors.surfaceAlt,
    borderTopLeftRadius: 18, borderTopRightRadius: 18, borderBottomRightRadius: 18, borderBottomLeftRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },

  quickRow: { paddingHorizontal: spacing.md, gap: 8, paddingVertical: 8 },
  quickChip: { backgroundColor: colors.primaryPale, borderRadius: 100, paddingHorizontal: 14, paddingVertical: 8 },

  composer: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: spacing.md, paddingTop: 6, borderTopWidth: 1, borderTopColor: colors.border },
  input: {
    flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12,
    fontFamily: fonts.body, fontSize: 14.5, color: colors.textPrimary, borderWidth: 1, borderColor: colors.border,
  },
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
})
