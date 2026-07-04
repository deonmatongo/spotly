import React from 'react'
import { View } from 'react-native'
import QRCodeSvg from 'react-native-qrcode-svg'

// A real, scannable QR (replaces the old decorative View-grid). Encodes the
// ticket's confirmation code so it can be validated at the door.
export default function TicketQR({ value, size = 100 }: { value: string; size?: number }) {
  return (
    <View style={{ backgroundColor: '#fff', padding: 6, borderRadius: 8 }}>
      <QRCodeSvg value={value} size={size} backgroundColor="#fff" color="#0D1B2A" />
    </View>
  )
}
