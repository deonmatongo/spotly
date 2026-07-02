import React, { useState } from 'react'
import { StyleSheet, View } from 'react-native'
import { Gesture, GestureDetector } from 'react-native-gesture-handler'
import Animated, {
  useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS, interpolate, Extrapolation,
} from 'react-native-reanimated'
import { Ionicons } from '@expo/vector-icons'
import AppText from './AppText'

const KNOB = 52
const PAD = 4

interface Props {
  label: string
  color: string
  trackColor: string
  onColor?: string
  onConfirm: () => void
}

export default function SlideToConfirm({ label, color, trackColor, onColor = '#fff', onConfirm }: Props) {
  const [trackWidth, setTrackWidth] = useState(0)
  const x = useSharedValue(0)
  const locked = useSharedValue(false)
  const maxX = Math.max(trackWidth - KNOB - PAD * 2, 1)

  const fire = () => onConfirm()

  const gesture = Gesture.Pan()
    .onChange(e => {
      if (locked.value) return
      x.value = Math.min(Math.max(0, x.value + e.changeX), maxX)
    })
    .onEnd(() => {
      if (x.value > maxX * 0.62) {
        locked.value = true
        x.value = withTiming(maxX, { duration: 140 })
        runOnJS(fire)()
      } else {
        x.value = withSpring(0, { damping: 16, stiffness: 220 })
      }
    })

  const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }))
  const fillStyle = useAnimatedStyle(() => ({ width: x.value + KNOB + PAD }))
  const labelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.5], [1, 0], Extrapolation.CLAMP),
  }))
  const chevronStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [0, maxX * 0.8], [0.55, 0], Extrapolation.CLAMP),
    transform: [{ translateX: interpolate(x.value, [0, maxX], [0, 6], Extrapolation.CLAMP) }],
  }))

  return (
    <View
      onLayout={e => setTrackWidth(e.nativeEvent.layout.width)}
      style={[styles.track, { backgroundColor: trackColor }]}
    >
      <Animated.View style={[styles.fill, fillStyle, { backgroundColor: color }]} />

      <Animated.View style={[styles.labelWrap, labelStyle]} pointerEvents="none">
        <AppText variant="bodyBold" style={{ color: color }}>{label}</AppText>
      </Animated.View>

      <View style={styles.chevronRow} pointerEvents="none">
        <Animated.View style={chevronStyle}><Ionicons name="chevron-forward" size={16} color={color} /></Animated.View>
        <Animated.View style={chevronStyle}><Ionicons name="chevron-forward" size={16} color={color} style={{ marginLeft: -8 }} /></Animated.View>
      </View>

      <GestureDetector gesture={gesture}>
        <Animated.View style={[styles.knob, knobStyle, { backgroundColor: color }]}>
          <Ionicons name="arrow-forward" size={20} color={onColor} />
        </Animated.View>
      </GestureDetector>
    </View>
  )
}

const styles = StyleSheet.create({
  track: { height: 60, borderRadius: 30, justifyContent: 'center', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, opacity: 0.14, borderRadius: 30 },
  labelWrap: { position: 'absolute', alignSelf: 'center' },
  chevronRow: { position: 'absolute', right: 24, flexDirection: 'row', alignItems: 'center' },
  knob: {
    position: 'absolute', left: PAD, width: KNOB, height: KNOB, borderRadius: KNOB / 2,
    alignItems: 'center', justifyContent: 'center',
  },
})
