import { useEffect, useState } from 'react'
import { orderBus } from '../services/orderBus'
import { DEMO_MERCHANT_ID, MerchantMenu } from '@spotly/shared'

// In the demo, Amanzi Restaurant (listing id 1) is the live-connected merchant.
// Its menu, prices, and availability come straight off the bus.
const LIVE_MERCHANT_LISTING_ID = 1

export default function useLiveMenu(listingId: number): MerchantMenu | null {
  const [menu, setMenu] = useState<MerchantMenu | null>(null)
  useEffect(() => {
    if (listingId !== LIVE_MERCHANT_LISTING_ID) return
    const off = orderBus.watchMenu(DEMO_MERCHANT_ID, setMenu)
    return off
  }, [listingId])
  return menu
}
