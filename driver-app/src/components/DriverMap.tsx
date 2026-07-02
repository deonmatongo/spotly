import React, { useEffect, useRef, useState } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MapView, { Marker, Polyline, AnimatedRegion, MarkerAnimated } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { fonts, cut, shadow } from '../theme'
import { useTheme } from '../context/ThemeContext'
import { locationTracker, LocalFix } from '../services/locationTracker'
import { MqttStatus } from '../services/mqttClient'
import { Coord } from '../data/mock'

interface Props {
  pickup: Coord
  dropoff: Coord
  stops?: Coord[]
  // live: follow the driver's own broadcast position; off = static route preview
  live?: boolean
  height?: number
}

const GREEN = '#16A34A'
const EDGE = { top: 40, right: 40, bottom: 40, left: 40 }

function pillFor(status: MqttStatus, hasFix: boolean) {
  if (status === 'connected' && hasFix) return { label: 'LIVE · broadcasting', dot: GREEN, fg: GREEN, bg: 'rgba(22,163,74,0.12)' }
  if (status === 'connected') return { label: 'Waiting for GPS…', dot: '#F59E0B', fg: '#B45309', bg: 'rgba(245,158,11,0.12)' }
  if (status === 'connecting' || status === 'reconnecting') return { label: 'Reconnecting…', dot: '#F59E0B', fg: '#B45309', bg: 'rgba(245,158,11,0.12)' }
  return { label: 'Offline', dot: '#9CA3AF', fg: '#6B7280', bg: 'rgba(107,114,128,0.12)' }
}

export default function DriverMap({ pickup, dropoff, stops = [], live = false, height = 200 }: Props) {
  const { colors } = useTheme()
  const mapRef = useRef<MapView>(null)
  const [status, setStatus] = useState<MqttStatus>('offline')
  const [path, setPath] = useState<LocalFix[]>([])
  const seeded = useRef(false)
  const regionRef = useRef(
    new AnimatedRegion({ latitude: pickup.lat, longitude: pickup.lng, latitudeDelta: 0, longitudeDelta: 0 })
  )

  const routePoints = [pickup, ...stops, dropoff]

  useEffect(() => {
    // Frame the whole route once the map lays out.
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        routePoints.map(c => ({ latitude: c.lat, longitude: c.lng })),
        { edgePadding: EDGE, animated: false },
      )
    }, 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!live) return
    const offStatus = locationTracker.onStatus(setStatus)
    const offFix = locationTracker.onFix(fix => {
      setPath(prev => (prev.length && prev[prev.length - 1].ts === fix.ts ? prev : [...prev.slice(-59), fix]))
      if (!seeded.current) {
        seeded.current = true
        regionRef.current.setValue({ latitude: fix.lat, longitude: fix.lng, latitudeDelta: 0, longitudeDelta: 0 })
        mapRef.current?.fitToCoordinates(
          [...routePoints, fix].map(c => ({ latitude: c.lat, longitude: c.lng })),
          { edgePadding: EDGE, animated: true },
        )
        return
      }
      regionRef.current.timing({
        latitude: fix.lat,
        longitude: fix.lng,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: 1500,
        useNativeDriver: false,
        // Required by the TimingAnimationConfig type but ignored by
        // AnimatedRegion — it animates per-axis to latitude/longitude.
        toValue: 0,
      }).start()
    })
    return () => { offStatus(); offFix() }
  }, [live])

  const pill = pillFor(status, path.length > 0)

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: (pickup.lat + dropoff.lat) / 2,
          longitude: (pickup.lng + dropoff.lng) / 2,
          latitudeDelta: Math.max(Math.abs(pickup.lat - dropoff.lat) * 2.2, 0.02),
          longitudeDelta: Math.max(Math.abs(pickup.lng - dropoff.lng) * 2.2, 0.02),
        }}
      >
        {/* Planned route */}
        <Polyline
          coordinates={routePoints.map(c => ({ latitude: c.lat, longitude: c.lng }))}
          strokeColor="rgba(22,163,74,0.55)"
          strokeWidth={3}
          lineDashPattern={[8, 6]}
        />

        {/* Traveled path */}
        {live && path.length > 1 && (
          <Polyline
            coordinates={path.map(p => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor={GREEN}
            strokeWidth={4}
          />
        )}

        {/* Pickup (merchant) */}
        <Marker coordinate={{ latitude: pickup.lat, longitude: pickup.lng }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pickupBadge}>
            <Ionicons name="storefront" size={12} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Stacked extra stops */}
        {stops.map((s, i) => (
          <Marker key={`${s.lat}-${s.lng}`} coordinate={{ latitude: s.lat, longitude: s.lng }} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.stopBadge}>
              <Text style={styles.stopNum}>{i + 2}</Text>
            </View>
          </Marker>
        ))}

        {/* Drop-off */}
        <Marker coordinate={{ latitude: dropoff.lat, longitude: dropoff.lng }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.destBadge}>
            <Ionicons name="flag" size={12} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Own live position — mirrors exactly what the customer sees */}
        {live && path.length > 0 && (
          <MarkerAnimated coordinate={regionRef.current} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.meBadge}>
              <Ionicons name="car-sport" size={15} color="#FFFFFF" />
            </View>
          </MarkerAnimated>
        )}
      </MapView>

      {live && (
        <View style={[styles.pill, { backgroundColor: colors.surface }]}>
          <View style={[styles.pillInner, { backgroundColor: pill.bg }]}>
            <View style={[styles.pillDot, { backgroundColor: pill.dot }]} />
            <Text style={[styles.pillText, { color: pill.fg }]}>{pill.label}</Text>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { ...cut.card, overflow: 'hidden', ...shadow.sm },
  meBadge: {
    width: 32, height: 32, borderRadius: 16, backgroundColor: GREEN,
    borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow.md,
  },
  pickupBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#F59E0B',
    borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  destBadge: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#EF4444',
    borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  stopBadge: {
    width: 22, height: 22, borderRadius: 11, backgroundColor: '#0D1B2A',
    borderWidth: 2, borderColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', ...shadow.sm,
  },
  stopNum: { fontFamily: fonts.bodyBold, fontSize: 10, color: '#FFFFFF' },
  pill: { position: 'absolute', top: 10, right: 10, borderRadius: 999, ...shadow.sm },
  pillInner: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 5 },
  pillDot: { width: 7, height: 7, borderRadius: 4 },
  pillText: { fontFamily: fonts.bodySemi, fontSize: 11, letterSpacing: 0.3 },
})
