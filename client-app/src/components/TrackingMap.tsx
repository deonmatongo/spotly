import React, { useEffect, useRef } from 'react'
import { View, Text, StyleSheet } from 'react-native'
import MapView, { Marker, Polyline, AnimatedRegion, MarkerAnimated } from 'react-native-maps'
import { Ionicons } from '@expo/vector-icons'
import { fonts, cut, shadow } from '../theme'
import { useTheme } from '../context/ThemeContext'
import useDriverLocation, { DriverFix, TrackingStatus } from '../hooks/useDriverLocation'
import { FALLBACK_CENTER, DEST_COORD, PICKUP_COORD } from '../config/tracking'

type Props = {
  tripRef: string
  height?: number
  onFix?: (fix: DriverFix) => void
}

const GREEN = '#16A34A'

function pillFor(status: TrackingStatus, hasFix: boolean) {
  if (status === 'live' && hasFix) return { label: 'LIVE', dot: GREEN, bg: 'rgba(22,163,74,0.12)', fg: GREEN }
  if (status === 'reconnecting' || status === 'connecting') {
    return { label: 'Reconnecting…', dot: '#F59E0B', bg: 'rgba(245,158,11,0.12)', fg: '#B45309' }
  }
  return { label: 'Waiting for driver…', dot: '#9CA3AF', bg: 'rgba(107,114,128,0.12)', fg: '#6B7280' }
}

export default function TrackingMap({ tripRef, height = 220, onFix }: Props) {
  const { colors } = useTheme()
  const { fix, path, status } = useDriverLocation(tripRef)
  const mapRef = useRef<MapView>(null)
  const regionRef = useRef(
    new AnimatedRegion({
      latitude: FALLBACK_CENTER.lat,
      longitude: FALLBACK_CENTER.lng,
      latitudeDelta: 0,
      longitudeDelta: 0,
    })
  )
  const seededRef = useRef(false)

  useEffect(() => {
    // Frame pickup + destination once the map lays out.
    const t = setTimeout(() => {
      mapRef.current?.fitToCoordinates(
        [PICKUP_COORD, DEST_COORD].map(c => ({ latitude: c.lat, longitude: c.lng })),
        { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: false },
      )
    }, 350)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!fix) return
    onFix?.(fix)
    if (!seededRef.current) {
      // First fix: jump straight there instead of animating from Harare CBD,
      // and re-frame so driver + pickup + destination are all visible.
      seededRef.current = true
      regionRef.current.setValue({
        latitude: fix.lat,
        longitude: fix.lng,
        latitudeDelta: 0,
        longitudeDelta: 0,
      })
      mapRef.current?.fitToCoordinates(
        [fix, PICKUP_COORD, DEST_COORD].map(c => ({ latitude: c.lat, longitude: c.lng })),
        { edgePadding: { top: 40, right: 40, bottom: 40, left: 40 }, animated: true },
      )
      return
    }
    regionRef.current
      .timing({
        latitude: fix.lat,
        longitude: fix.lng,
        latitudeDelta: 0,
        longitudeDelta: 0,
        duration: 1500,
        useNativeDriver: false,
        // Required by the TimingAnimationConfig type but ignored by
        // AnimatedRegion — it animates per-axis to latitude/longitude.
        toValue: 0,
      })
      .start()
  }, [fix])

  const pill = pillFor(status, !!fix)

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        initialRegion={{
          latitude: (PICKUP_COORD.lat + DEST_COORD.lat) / 2,
          longitude: (PICKUP_COORD.lng + DEST_COORD.lng) / 2,
          latitudeDelta: 0.035,
          longitudeDelta: 0.035,
        }}
      >
        {/* Planned route: merchant → you */}
        <Polyline
          coordinates={[PICKUP_COORD, DEST_COORD].map(c => ({ latitude: c.lat, longitude: c.lng }))}
          strokeColor="rgba(22,163,74,0.5)"
          strokeWidth={3}
          lineDashPattern={[8, 6]}
        />

        {path.length > 1 && (
          <Polyline
            coordinates={path.map(p => ({ latitude: p.lat, longitude: p.lng }))}
            strokeColor="#16A34A"
            strokeWidth={4}
          />
        )}

        {/* Pickup — where the driver collects your order */}
        <Marker
          coordinate={{ latitude: PICKUP_COORD.lat, longitude: PICKUP_COORD.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.pickupBadge}>
            <Ionicons name="storefront" size={12} color="#FFFFFF" />
          </View>
        </Marker>

        {/* Destination — you */}
        <Marker
          coordinate={{ latitude: DEST_COORD.lat, longitude: DEST_COORD.lng }}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <View style={styles.destBadge}>
            <Ionicons name="home" size={12} color="#FFFFFF" />
          </View>
        </Marker>

        <MarkerAnimated coordinate={regionRef.current} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.driverBadge}>
            <Ionicons name="bicycle" size={16} color="#FFFFFF" />
          </View>
        </MarkerAnimated>
      </MapView>

      <View style={[styles.pill, { backgroundColor: colors.surface }]}>
        <View style={[styles.pillInner, { backgroundColor: pill.bg }]}>
          <View style={[styles.pillDot, { backgroundColor: pill.dot }]} />
          <Text style={[styles.pillText, { color: pill.fg }]}>{pill.label}</Text>
        </View>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    ...cut.card,
    overflow: 'hidden',
    ...shadow.sm,
  },
  driverBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: GREEN,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
  destBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EF4444',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  pickupBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F59E0B',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.sm,
  },
  pill: {
    position: 'absolute',
    top: 10,
    right: 10,
    borderRadius: 999,
    ...shadow.sm,
  },
  pillInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  pillDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  pillText: {
    fontFamily: fonts.bodySemi,
    fontSize: 11,
    letterSpacing: 0.3,
  },
})
