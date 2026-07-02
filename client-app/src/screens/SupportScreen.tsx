import React, { useState, useRef, useEffect } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { colors, spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'

type Nav = NativeStackNavigationProp<RootStackParamList>

interface Msg { id: string; from: 'bot' | 'me'; text: string }

const QUICK = [
  'Where is my order?',
  'Cancel a booking',
  'Refund a ticket',
  'Talk to a human',
]

function botReply(input: string): string {
  const q = input.toLowerCase()
  if (q.includes('order') || q.includes('delivery') || q.includes('where'))
    return "Your most recent order is on its way — the rider is about 12 minutes out. You can watch it live under Bookings → order tracking. Anything else?"
  if (q.includes('cancel'))
    return 'No problem. Open Bookings, tap the reservation, then "Cancel". Cancellations more than 2 hours ahead are free of charge. Want me to walk you through it?'
  if (q.includes('refund') || q.includes('ticket'))
    return "Tickets are refundable up to 48 hours before the event. I've flagged your account — refunds land back on your original payment method within 3–5 business days."
  if (q.includes('human') || q.includes('agent') || q.includes('person'))
    return "Sure — connecting you to a Spotly specialist. Tendai will be with you in under 2 minutes. In the meantime, feel free to describe your issue."
  if (q.includes('points') || q.includes('reward'))
    return 'You currently have 1,240 Spotly Points. Points are credited after each completed booking and can be redeemed for rewards on your Profile. 🎁'
  if (q.includes('thank'))
    return "You're very welcome! Glad I could help. 💚"
  return "Thanks for that! I've noted it down. A Spotly specialist will follow up shortly — is there anything else I can help with right now?"
}

export default function SupportScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation<Nav>()
  const insets = useSafeAreaInsets()
  const scrollRef = useRef<ScrollView>(null)
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm0', from: 'bot', text: "Hi Deon 👋 I'm Sasa, your Spotly assistant. How can I help you today?" },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const idRef = useRef(1)

  const scrollEnd = () => { setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 60) }
  useEffect(() => { scrollEnd() }, [messages, typing])

  const send = (raw: string) => {
    const text = raw.trim()
    if (!text) return
    const myId = `me-${idRef.current++}`
    setMessages(prev => [...prev, { id: myId, from: 'me', text }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setTyping(false)
      setMessages(prev => [...prev, { id: `bot-${idRef.current++}`, from: 'bot', text: botReply(text) }])
    }, 1100)
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={22} color={colors.textPrimary} />
        </Pressable>
        <View style={styles.agentInfo}>
          <View style={styles.agentAvatar}>
            <Ionicons name="chatbubble-ellipses" size={16} color={colors.white} />
            <View style={styles.onlineDot} />
          </View>
          <View>
            <Text style={styles.agentName}>Spotly Support</Text>
            <Text style={styles.agentStatus}>Online · replies in seconds</Text>
          </View>
        </View>
        <View style={{ width: 36 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}>
        <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.messages} showsVerticalScrollIndicator={false}>
          {messages.map(m => (
            <View key={m.id} style={[styles.bubbleRow, m.from === 'me' ? styles.rowMe : styles.rowBot]}>
              {m.from === 'bot' && (
                <View style={styles.botBadge}><Ionicons name="chatbubble-ellipses" size={12} color={colors.white} /></View>
              )}
              <View style={[styles.bubble, m.from === 'me' ? styles.bubbleMe : styles.bubbleBot]}>
                <Text style={[styles.bubbleText, m.from === 'me' && styles.bubbleTextMe]}>{m.text}</Text>
              </View>
            </View>
          ))}

          {typing && (
            <View style={[styles.bubbleRow, styles.rowBot]}>
              <View style={styles.botBadge}><Ionicons name="chatbubble-ellipses" size={12} color={colors.white} /></View>
              <View style={[styles.bubble, styles.bubbleBot, styles.typing]}>
                <Text style={styles.typingDots}>● ● ●</Text>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick replies */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickWrap} contentContainerStyle={{ gap: 8, paddingHorizontal: spacing.md }}>
          {QUICK.map(q => (
            <Pressable key={q} style={styles.quickChip} onPress={() => send(q)}>
              <Text style={styles.quickText}>{q}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            style={styles.input}
            value={input}
            onChangeText={setInput}
            placeholder="Type a message…"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => send(input)}
            returnKeyType="send"
          />
          <Pressable style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} onPress={() => send(input)} disabled={!input.trim()}>
            <Ionicons name="arrow-up" size={20} color={colors.white} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  agentInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  agentAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  onlineDot: { position: 'absolute', bottom: 0, right: 0, width: 11, height: 11, borderRadius: 6, backgroundColor: '#22C55E', borderWidth: 2, borderColor: colors.white },
  agentName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  agentStatus: { fontSize: 11, color: colors.primary, fontWeight: '500' },
  scroll: { flex: 1, backgroundColor: colors.surfaceAlt },
  messages: { padding: spacing.md, gap: 10 },
  bubbleRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, maxWidth: '85%' },
  rowMe: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  rowBot: { alignSelf: 'flex-start' },
  botBadge: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleBot: { backgroundColor: colors.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: colors.border },
  bubbleMe: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  bubbleTextMe: { color: colors.white },
  typing: { paddingVertical: 12 },
  typingDots: { fontSize: 8, color: colors.textLight, letterSpacing: 2 },
  quickWrap: { maxHeight: 50, paddingVertical: 8, backgroundColor: colors.surface },
  quickChip: { borderWidth: 1.5, borderColor: colors.primaryBorder, backgroundColor: colors.primaryPale, borderRadius: radius.full, paddingHorizontal: 14, paddingVertical: 8, height: 34, justifyContent: 'center' },
  quickText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  inputBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: spacing.md, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.full, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, color: colors.textPrimary, maxHeight: 100 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { backgroundColor: colors.textLight },
})
