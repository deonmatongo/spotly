import React, { useState } from 'react'
import { View, Text, ScrollView, Pressable, TextInput, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { NativeStackNavigationProp } from '@react-navigation/native-stack'
import { LinearGradient } from 'expo-linear-gradient'
import { spacing, radius } from '../theme'
import { useTheme, Palette } from '../context/ThemeContext'
import { RootStackParamList } from '../navigation'
import { useNotifications } from '../context/NotificationsContext'

type Nav = NativeStackNavigationProp<RootStackParamList>

const SIZES = [
  { id: 'small', label: 'Small', desc: 'Documents, keys · up to 2kg', fee: 4 },
  { id: 'medium', label: 'Medium', desc: 'Shoebox-sized · up to 8kg', fee: 7 },
  { id: 'large', label: 'Large', desc: 'Big parcel · up to 20kg', fee: 12 },
]

export default function CourierScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const insets = useSafeAreaInsets()
  const nav = useNavigation<Nav>()
  const { addNotification } = useNotifications()

  const [pickup, setPickup] = useState('')
  const [dropoff, setDropoff] = useState('')
  const [recipient, setRecipient] = useState('')
  const [phone, setPhone] = useState('')
  const [size, setSize] = useState('small')
  const [notes, setNotes] = useState('')
  const [done, setDone] = useState(false)
  const [code, setCode] = useState('')

  const sel = SIZES.find(s => s.id === size)!
  const serviceFee = 1.5
  const total = sel.fee + serviceFee
  const canSubmit = !!pickup.trim() && !!dropoff.trim() && !!recipient.trim()

  const submit = () => {
    if (!canSubmit) return
    const ref = 'SPT-' + Math.floor(1000 + Math.random() * 9000)
    setCode(ref)
    addNotification({
      type: 'order',
      title: 'Courier requested 📦',
      body: `Pickup from ${pickup.trim()} → ${dropoff.trim()}. A rider will be assigned shortly. Ref ${ref}.`,
    })
    setDone(true)
  }

  if (done) return (
    <View style={styles.safe}>
      <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Courier</Text>
            <View style={{ width: 36 }} />
          </View>
        </SafeAreaView>
      </LinearGradient>
      <View style={styles.successWrap}>
        <View style={styles.successIcon}><Ionicons name="cube" size={36} color={colors.white} /></View>
        <Text style={styles.successTitle}>Courier on the way!</Text>
        <Text style={styles.successSub}>A rider is being assigned to collect your {sel.label.toLowerCase()} package.</Text>
        <View style={styles.successCard}>
          <Row colors={colors} label="From" value={pickup.trim()} />
          <Row colors={colors} label="To" value={dropoff.trim()} />
          <Row colors={colors} label="Recipient" value={recipient.trim()} />
          <Row colors={colors} label="Total" value={`$${total.toFixed(2)}`} />
          <Row colors={colors} label="Ref" value={code} />
        </View>
        <Pressable style={styles.primaryBtn} onPress={() => nav.goBack()}>
          <Text style={styles.primaryBtnText}>Done</Text>
        </Pressable>
      </View>
    </View>
  )

  return (
    <View style={styles.safe}>
      <LinearGradient colors={['#166534', '#15803D', '#16A34A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <Pressable onPress={() => nav.goBack()} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={22} color={colors.white} />
            </Pressable>
            <Text style={styles.headerTitle}>Send a Package</Text>
            <View style={{ width: 36 }} />
          </View>
          <Text style={styles.headerSub}>Same-day courier across Harare</Text>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <Text style={styles.label}>Pickup address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="location-outline" size={18} color={colors.primary} />
            <TextInput value={pickup} onChangeText={setPickup} placeholder="Where should we collect?" placeholderTextColor={colors.textLight} style={styles.input} />
          </View>

          <Text style={styles.label}>Drop-off address</Text>
          <View style={styles.inputRow}>
            <Ionicons name="flag-outline" size={18} color={colors.primary} />
            <TextInput value={dropoff} onChangeText={setDropoff} placeholder="Where is it going?" placeholderTextColor={colors.textLight} style={styles.input} />
          </View>

          <Text style={styles.label}>Recipient</Text>
          <View style={styles.inputRow}>
            <Ionicons name="person-outline" size={18} color={colors.primary} />
            <TextInput value={recipient} onChangeText={setRecipient} placeholder="Recipient name" placeholderTextColor={colors.textLight} style={styles.input} />
          </View>
          <View style={styles.inputRow}>
            <Ionicons name="call-outline" size={18} color={colors.primary} />
            <TextInput value={phone} onChangeText={setPhone} placeholder="Recipient phone (optional)" placeholderTextColor={colors.textLight} keyboardType="phone-pad" style={styles.input} />
          </View>

          <Text style={styles.label}>Package size</Text>
          {SIZES.map(s => (
            <Pressable key={s.id} onPress={() => setSize(s.id)} style={[styles.sizeCard, size === s.id && styles.sizeCardActive]}>
              <View style={styles.sizeInfo}>
                <Text style={styles.sizeName}>{s.label}</Text>
                <Text style={styles.sizeDesc}>{s.desc}</Text>
              </View>
              <Text style={styles.sizeFee}>${s.fee.toFixed(2)}</Text>
              <View style={[styles.radio, size === s.id && styles.radioActive]}>
                {size === s.id && <View style={styles.radioDot} />}
              </View>
            </Pressable>
          ))}

          <Text style={styles.label}>Notes (optional)</Text>
          <TextInput value={notes} onChangeText={setNotes} placeholder="Fragile, gate code, leave with security…" placeholderTextColor={colors.textLight} multiline style={[styles.input, styles.notes]} />

          <View style={styles.summary}>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Courier ({sel.label})</Text><Text style={styles.summaryVal}>${sel.fee.toFixed(2)}</Text></View>
            <View style={styles.summaryRow}><Text style={styles.summaryLabel}>Service fee</Text><Text style={styles.summaryVal}>${serviceFee.toFixed(2)}</Text></View>
            <View style={styles.summaryDivider} />
            <View style={styles.summaryRow}><Text style={styles.summaryTotal}>Total</Text><Text style={styles.summaryTotal}>${total.toFixed(2)}</Text></View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.ctaWrap, { paddingBottom: Math.max(insets.bottom + 12, 20) }]}>
        <Pressable onPress={submit} style={[styles.primaryBtn, !canSubmit && { opacity: 0.5 }]} disabled={!canSubmit}>
          <Ionicons name="cube-outline" size={18} color={colors.white} />
          <Text style={styles.primaryBtnText}>Request Courier · ${total.toFixed(2)}</Text>
        </Pressable>
      </View>
    </View>
  )
}

function Row({ colors, label, value }: { colors: Palette; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 }}>
      <Text style={{ fontSize: 13, color: colors.textMuted }}>{label}</Text>
      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary, flexShrink: 1, textAlign: 'right', marginLeft: 16 }} numberOfLines={1}>{value}</Text>
    </View>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.md, paddingBottom: 16, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 6 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.white },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)', textAlign: 'center', marginTop: 6 },
  content: { padding: spacing.md, paddingBottom: 120 },
  label: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 8, marginTop: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.lg, borderWidth: 1.5, borderColor: colors.border, paddingHorizontal: 12, paddingVertical: 12, marginBottom: 10 },
  input: { flex: 1, fontSize: 14, color: colors.textPrimary, padding: 0 },
  notes: { minHeight: 70, textAlignVertical: 'top', borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, backgroundColor: colors.surfaceAlt, paddingHorizontal: 12, paddingVertical: 12 },
  sizeCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1.5, borderColor: colors.border, borderRadius: radius.lg, padding: 14, marginBottom: 10 },
  sizeCardActive: { borderColor: colors.primary, backgroundColor: colors.primaryPale },
  sizeInfo: { flex: 1 },
  sizeName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  sizeDesc: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sizeFee: { fontSize: 15, fontWeight: '800', color: colors.primary, marginRight: 4 },
  radio: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  summary: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginTop: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: colors.textMuted },
  summaryVal: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  summaryDivider: { height: 1, backgroundColor: colors.border, marginVertical: 6 },
  summaryTotal: { fontSize: 16, fontWeight: '800', color: colors.textPrimary },
  ctaWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, borderTopWidth: 1, borderTopColor: colors.border, padding: spacing.md },
  primaryBtn: { backgroundColor: colors.primary, borderRadius: radius.lg, paddingVertical: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  primaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.white },
  successWrap: { flex: 1, alignItems: 'center', padding: spacing.lg, paddingTop: 40 },
  successIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  successTitle: { fontSize: 24, fontWeight: '800', color: colors.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 14, color: colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 },
  successCard: { width: '100%', backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, padding: spacing.md, marginBottom: 24 },
})
