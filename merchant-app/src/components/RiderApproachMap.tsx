import React, { useEffect, useRef } from 'react'
import { View, StyleSheet } from 'react-native'
import MapView, { Marker, Polyline, AnimatedRegion, MarkerAnimated } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { cut, shadow } from '../theme'
import { Palette } from '../context/ThemeContext'
import useTripLocation, { TrackingStatus } from '../hooks/useTripLocation'
import { STORE_COORD, FALLBACK_CENTER } from '../config/tracking'
import AppText from './AppText'

const GREEN = '#16A34A'

function pill(status: TrackingStatus, hasFix: boolean) {
  if (status === 'live' && hasFix) return { label: 'Rider en route', dot: GREEN, fg: GREEN, bg: 'rgba(22,163,74,0.14)' }
  if (status === 'reconnecting' || status === 'connecting') return { label: 'Connecting…', dot: '#F59E0B', fg: '#B45309', bg: 'rgba(245,158,11,0.14)' }
  return { label: 'Waiting for rider…', dot: '#94A3B8', fg: '#64748B', bg: 'rgba(148,163,184,0.14)' }
}

// Read-only map showing the assigned rider approaching the store to collect.
export default function RiderApproachMap({ tripRef, colors, height = 190 }: { tripRef: string; colors: Palette; height?: number }) {
  const { fix, path, status } = useTripLocation(tripRef)
  const mapRef = useRef<MapView>(null)
  const seeded = useRef(false)
  const regionRef = useRef(new AnimatedRegion({
    latitude: FALLBACK_CENTER.lat, longitude: FALLBACK_CENTER.lng, latitudeDelta: 0, longitudeDelta: 0,
  }))

  useEffect(() => {
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [STORE_COORD].map(c => ({ latitude: c.lat, longitude: c.lng })),
        { edgePadding: { top: 60, right: 60, bottom: 60, left: 60 }, animated: false },
      )
    }, 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!fix) return
    if (!seeded.current) {
      seeded.current = true
      regionRef.current.setValue({ latitude: fix.lat, longitude: fix.lng, latitudeDelta: 0, longitudeDelta: 0 })
      mapRef.current?.fitToCoordinates(
        [fix, STORE_COORD].map(c => ({ latitude: c.lat, longitude: c.lng })),
        { edgePadding: { top: 50, right: 50, bottom: 50, left: 50 }, animated: true },
      )
      return
    }
    regionRef.current.timing({
      latitude: fix.lat, longitude: fix.lng, latitudeDelta: 0, longitudeDelta: 0,
      duration: 1500, useNativeDriver: false, toValue: 0,
    }).start()
  }, [fix])

  const p = pill(status, !!fix)

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude: STORE_COORD.lat, longitude: STORE_COORD.lng, latitudeDelta: 0.03, longitudeDelta: 0.03 }}
      >
        {path.length > 1 && (
          <Polyline coordinates={path.map(pt => ({ latitude: pt.lat, longitude: pt.lng }))} strokeColor={GREEN} strokeWidth={4} />
        )}
        {/* The store (collection point) */}
        <Marker coordinate={{ latitude: STORE_COORD.lat, longitude: STORE_COORD.lng }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.storeBadge}><Ionicons name="storefront" size={13} color="#fff" /></View>
        </Marker>
        {/* Live rider position */}
        {fix && (
          <MarkerAnimated coordinate={regionRef.current as any} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.riderBadge}><Ionicons name="car-sport" size={15} color="#fff" /></View>
          </MarkerAnimated>
        )}
      </MapView>

      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <View style={[styles.pillInner, { backgroundColor: p.bg }]}>
          <View style={[styles.pillDot, { backgroundColor: p.dot }]} />
          <AppText variant="label" style={{ fontSize: 9.5, color: p.fg, letterSpacing: 0.3 }}>{p.label}</AppText>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { ...cut.card, overflow: 'hidden', ...shadow.sm },
  storeBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: GREEN, borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.sm },
  riderBadge: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#0D1B2A', borderWidth: 2, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.md },
  pill: { position: 'absolute', top: 10, right: 10, borderRadius: 999, ...shadow.sm },
  pillInner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
})
