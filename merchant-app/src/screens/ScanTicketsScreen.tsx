import React, { useEffect, useRef, useState } from 'react'
import { View, StyleSheet, Pressable } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Ionicons } from '@expo/vector-icons'
import { useNavigation } from '@react-navigation/native'
import { CameraView, useCameraPermissions } from 'expo-camera'
import Animated, { FadeIn } from 'react-native-reanimated'
import { spacing, cut } from '../theme'
import { Palette, useTheme } from '../context/ThemeContext'
import { SpotlyClient, IssuedTicket } from '@spotly/shared'
import AppText from '../components/AppText'
import Tappable from '../components/Tappable'

type Result =
  | { kind: 'success'; ticket: IssuedTicket }
  | { kind: 'redeemed'; ticket: IssuedTicket }
  | { kind: 'invalid'; code: string }

export default function ScanTicketsScreen() {
  const { colors } = useTheme()
  const styles = makeStyles(colors)
  const nav = useNavigation()
  const [perm, requestPerm] = useCameraPermissions()
  const [result, setResult] = useState<Result | null>(null)
  const [redeemedCount, setRedeemedCount] = useState(0)
  const busRef = useRef<SpotlyClient | null>(null)
  const ticketsRef = useRef<Map<string, IssuedTicket>>(new Map())
  const busyRef = useRef(false)

  useEffect(() => {
    const bus = new SpotlyClient('merchant')
    busRef.current = bus
    const off = bus.watchTickets(t => ticketsRef.current.set(t.code, t))
    bus.connect()
    if (!perm?.granted) requestPerm()
    return () => { off(); bus.disconnect() }
  }, [])

  const onScan = ({ data }: { data: string }) => {
    if (busyRef.current || result) return
    busyRef.current = true
    const code = (data || '').trim()
    const t = ticketsRef.current.get(code)
    if (!t) {
      setResult({ kind: 'invalid', code })
    } else if (t.status === 'redeemed') {
      setResult({ kind: 'redeemed', ticket: t })
    } else {
      busRef.current?.redeemTicket(t)
      ticketsRef.current.set(code, { ...t, status: 'redeemed', redeemedAt: Date.now() })
      setRedeemedCount(n => n + 1)
      setResult({ kind: 'success', ticket: t })
    }
  }

  const scanNext = () => { setResult(null); busyRef.current = false }

  const meta = result?.kind === 'success'
    ? { color: colors.primary, icon: 'checkmark-circle' as const, title: 'Ticket valid', sub: 'Admitted ✓' }
    : result?.kind === 'redeemed'
      ? { color: colors.amber, icon: 'alert-circle' as const, title: 'Already used', sub: 'This ticket was already scanned' }
      : { color: colors.red, icon: 'close-circle' as const, title: 'Invalid ticket', sub: 'No matching ticket found' }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Pressable onPress={() => nav.goBack()} hitSlop={12} style={[styles.backBtn, { borderColor: colors.border }]}>
          <Ionicons name="arrow-back" size={20} color={colors.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <AppText variant="h2" style={{ color: colors.textPrimary }}>Scan tickets</AppText>
          <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>{redeemedCount} admitted this session</AppText>
        </View>
      </View>

      {!perm ? (
        <View style={styles.center}><AppText variant="body" style={{ color: colors.textMuted }}>Checking camera…</AppText></View>
      ) : !perm.granted ? (
        <View style={styles.center}>
          <Ionicons name="camera-outline" size={40} color={colors.textLight} />
          <AppText variant="h3" style={{ color: colors.textPrimary, marginTop: 12 }}>Camera access needed</AppText>
          <AppText variant="caption" style={{ color: colors.textMuted, textAlign: 'center', marginTop: 6, paddingHorizontal: 30 }}>
            Allow the camera to scan attendees' ticket QR codes at the door.
          </AppText>
          <Tappable onPress={requestPerm} style={[styles.enableBtn, { backgroundColor: colors.primary }]}>
            <AppText variant="bodyBold" style={{ color: '#fff' }}>Enable camera</AppText>
          </Tappable>
        </View>
      ) : (
        <View style={styles.scanArea}>
          <CameraView
            style={StyleSheet.absoluteFill}
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={result ? undefined : onScan}
          />
          {/* Reticle */}
          <View style={styles.reticleWrap} pointerEvents="none">
            <View style={[styles.reticle, { borderColor: '#fff' }]} />
            <AppText variant="bodySemi" style={styles.hint}>Point at the ticket QR</AppText>
          </View>

          {/* Result overlay */}
          {result && (
            <Animated.View entering={FadeIn.duration(180)} style={styles.resultOverlay}>
              <View style={[styles.resultCard, { backgroundColor: colors.surface, borderColor: meta.color }]}>
                <View style={[styles.resultIcon, { backgroundColor: meta.color + '22' }]}>
                  <Ionicons name={meta.icon} size={40} color={meta.color} />
                </View>
                <AppText variant="h2" style={{ color: meta.color, marginTop: 12 }}>{meta.title}</AppText>
                <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 4 }}>{meta.sub}</AppText>
                {result.kind !== 'invalid' && (
                  <View style={[styles.ticketMeta, { borderColor: colors.border }]}>
                    <AppText variant="bodyBold" style={{ color: colors.textPrimary }}>{result.ticket.eventName}</AppText>
                    <AppText variant="caption" style={{ color: colors.textMuted, marginTop: 2 }}>
                      {result.ticket.holder} · {result.ticket.quantity} {result.ticket.quantity === 1 ? 'ticket' : 'tickets'}
                      {result.ticket.tierName ? ` · ${result.ticket.tierName}` : ''}
                    </AppText>
                    <AppText variant="label" style={{ color: colors.textLight, fontSize: 9.5, marginTop: 6 }}>{result.ticket.code}</AppText>
                  </View>
                )}
                {result.kind === 'invalid' && (
                  <AppText variant="label" style={{ color: colors.textLight, fontSize: 9.5, marginTop: 10 }}>{result.code}</AppText>
                )}
                <Tappable onPress={scanNext} style={[styles.nextBtn, { backgroundColor: colors.primary }]}>
                  <Ionicons name="scan" size={18} color="#fff" />
                  <AppText variant="bodyBold" style={{ color: '#fff' }}>Scan next</AppText>
                </Tappable>
              </View>
            </Animated.View>
          )}
        </View>
      )}
    </SafeAreaView>
  )
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: spacing.md, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border },
  backBtn: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: 4 },
  enableBtn: { borderRadius: 100, paddingVertical: 14, paddingHorizontal: 30, marginTop: 20 },

  scanArea: { flex: 1, backgroundColor: '#000' },
  reticleWrap: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', gap: 16 },
  reticle: { width: 240, height: 240, borderWidth: 3, borderRadius: 28, opacity: 0.9 },
  hint: { color: '#fff', textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 6 },

  resultOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(4,10,18,0.75)', alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  resultCard: { ...cut.sheet, borderWidth: 1.5, padding: spacing.xl, alignItems: 'center', alignSelf: 'stretch' },
  resultIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center' },
  ticketMeta: { alignItems: 'center', borderTopWidth: 1, marginTop: 16, paddingTop: 16, alignSelf: 'stretch' },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, alignSelf: 'stretch', borderRadius: 100, paddingVertical: 15, marginTop: 20 },
})
