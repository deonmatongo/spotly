import React, { ReactNode } from 'react'
import { Pressable, PressableProps, ViewStyle, StyleProp } from 'react-native'
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated'

const AnimatedPressable = Animated.createAnimatedComponent(Pressable)

interface Props extends PressableProps {
  children: ReactNode
  style?: StyleProp<ViewStyle>
  scaleTo?: number
}

export default function Tappable({ children, style, scaleTo = 0.96, ...props }: Props) {
  const scale = useSharedValue(1)
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))

  return (
    <AnimatedPressable
      {...props}
      onPressIn={e => { scale.value = withSpring(scaleTo, { damping: 14, stiffness: 300 }); props.onPressIn?.(e) }}
      onPressOut={e => { scale.value = withSpring(1, { damping: 10, stiffness: 200 }); props.onPressOut?.(e) }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  )
}
