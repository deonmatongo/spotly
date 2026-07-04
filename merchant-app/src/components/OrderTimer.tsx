import React, { useEffect, useState } from 'react'
import { View, StyleSheet } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { Palette } from '../context/ThemeContext'
import AppText from './AppText'

// A live, ticking "elapsed since placed" chip — a kitchen-display staple.
// Colour escalates as the order ages past its prep window.
export default function OrderTimer({ placedTs, colors }: { placedTs: number; colors: Palette }) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const elapsed = Math.max(0, Math.floor((now - placedTs) / 1000))
  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const color = m >= 20 ? colors.red : m >= 10 ? colors.amber : colors.primary
  const label = m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}:${String(s).padStart(2, '0')}`

  return (
    <View style={[styles.chip, { backgroundColor: color + '1F' }]}>
      <Ionicons name="time-outline" size={11} color={color} />
      <AppText variant="label" style={{ fontSize: 9.5, color, letterSpacing: 0.3 }}>{label}</AppText>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 100 },
})
