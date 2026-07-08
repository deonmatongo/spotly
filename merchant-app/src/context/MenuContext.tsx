import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react'
import { menuItems as seed, MenuItem, MenuCategory } from '../data/mock'
import { SpotlyClient, DEMO_MERCHANT_ID } from '@spotly/shared'

interface NewItem {
  name: string
  price: number
  description: string
  category: MenuCategory
  available: boolean
}

interface MenuContextType {
  items: MenuItem[]
  toggleAvailability: (id: string) => void
  setPrice: (id: string, price: number) => void
  addItem: (item: NewItem) => void
}

const MenuContext = createContext<MenuContextType | null>(null)

// Holds the merchant's menu and publishes it (retained) to the bus so the
// customer app always shows the current items, prices, and availability.
export function MenuProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<MenuItem[]>(seed)
  const clientRef = useRef<SpotlyClient | null>(null)

  useEffect(() => {
    const c = new SpotlyClient('merchant')
    clientRef.current = c
    c.connect()
    return () => c.disconnect()
  }, [])

  // Re-publish whenever the menu changes (publish() queues until connected).
  useEffect(() => {
    clientRef.current?.publishMenu(DEMO_MERCHANT_ID, items.map(i => ({
      id: i.id, name: i.name, category: i.category, price: i.price,
      description: i.description, available: i.available,
    })))
  }, [items])

  const toggleAvailability = (id: string) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i))
  const setPrice = (id: string, price: number) =>
    setItems(prev => prev.map(i => i.id === id ? { ...i, price } : i))
  const addItem = (item: NewItem) =>
    setItems(prev => [{ ...item, id: 'm' + Date.now(), soldToday: 0 }, ...prev])

  return (
    <MenuContext.Provider value={{ items, toggleAvailability, setPrice, addItem }}>
      {children}
    </MenuContext.Provider>
  )
}

export function useMenu() {
  const ctx = useContext(MenuContext)
  if (!ctx) throw new Error('useMenu must be used within MenuProvider')
  return ctx
}
