import React from 'react'
import { Text, TextProps, StyleSheet } from 'react-native'
import { fonts } from '../theme'

type Variant = 'display' | 'h1' | 'h2' | 'h3' | 'num' | 'body' | 'bodySemi' | 'bodyBold' | 'label' | 'caption'

const VARIANTS = StyleSheet.create({
  display: { fontFamily: fonts.display, fontSize: 44, letterSpacing: -1.5, lineHeight: 46 },
  h1: { fontFamily: fonts.display, fontSize: 26, letterSpacing: -0.6, lineHeight: 30 },
  h2: { fontFamily: fonts.displayMid, fontSize: 20, letterSpacing: -0.3 },
  h3: { fontFamily: fonts.displayMid, fontSize: 16.5, letterSpacing: -0.1 },
  num: { fontFamily: fonts.display, letterSpacing: -1 },
  body: { fontFamily: fonts.body, fontSize: 14.5 },
  bodySemi: { fontFamily: fonts.bodySemi, fontSize: 14.5 },
  bodyBold: { fontFamily: fonts.bodyBold, fontSize: 15 },
  label: { fontFamily: fonts.bodyBold, fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase' },
  caption: { fontFamily: fonts.bodyReg, fontSize: 12 },
})

export default function AppText({ variant = 'body', style, ...props }: TextProps & { variant?: Variant }) {
  return <Text {...props} style={[VARIANTS[variant], style]} />
}
