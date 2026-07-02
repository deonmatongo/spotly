import React, { useEffect } from 'react'
import { Pressable, StyleSheet } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring, interpolateColor, interpolate } from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'

interface Props {
  value: boolean
  onChange: (v: boolean) => void
  activeColor: string
  activeGlow: string
  trackOff: string
}

const W = 60
const H = 34
const KNOB = 28

export default function PowerToggle({ value, onChange, activeColor, activeGlow, trackOff }: Props) {
  const progress = useSharedValue(value ? 1 : 0)

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, { damping: 14, stiffness: 180 })
  }, [value])

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [trackOff, activeColor]),
  }))
  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [3, W - KNOB - 3]) }],
  }))
  const iconOpacityOn = useAnimatedStyle(() => ({ opacity: progress.value }))
  const iconOpacityOff = useAnimatedStyle(() => ({ opacity: 1 - progress.value }))

  return (
    <Pressable onPress={() => onChange(!value)} hitSlop={8}>
      <Animated.View style={[styles.track, trackStyle, value && { shadowColor: activeGlow, shadowOpacity: 0.6, shadowRadius: 10, shadowOffset: { width: 0, height: 0 }, elevation: 6 }]}>
        <Animated.View style={[styles.knob, knobStyle]}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.iconWrap, iconOpacityOn]}>
            <Ionicons name="flash" size={14} color={activeColor} />
          </Animated.View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.iconWrap, iconOpacityOff]}>
            <Ionicons name="moon" size={12} color="#94A3B8" />
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  track: { width: W, height: H, borderRadius: H / 2, justifyContent: 'center' },
  knob: { position: 'absolute', width: KNOB, height: KNOB, borderRadius: KNOB / 2, backgroundColor: '#fff' },
  iconWrap: { alignItems: 'center', justifyContent: 'center' },
})
