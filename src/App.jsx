import { useState, useCallback } from 'react'
import BottomNav from './components/BottomNav.jsx'
import SplashScreen from './screens/SplashScreen.jsx'
import HomeScreen from './screens/HomeScreen.jsx'
import SearchScreen from './screens/SearchScreen.jsx'
import DetailScreen from './screens/DetailScreen.jsx'
import BookingScreen from './screens/BookingScreen.jsx'
import CartScreen from './screens/CartScreen.jsx'
import CheckoutScreen from './screens/CheckoutScreen.jsx'
import BookingsScreen from './screens/BookingsScreen.jsx'
import ReviewsScreen from './screens/ReviewsScreen.jsx'
import ProfileScreen from './screens/ProfileScreen.jsx'

const TAB_SCREENS = ['home', 'search', 'bookings', 'reviews', 'profile']

export default function App() {
  const [stack, setStack] = useState([{ screen: 'splash', params: {} }])
  const [activeTab, setActiveTab] = useState('home')
  const [cart, setCart] = useState([])

  const current = stack[stack.length - 1]

  const navigate = useCallback((screen, params = {}) => {
    setStack(prev => [...prev, { screen, params }])
    if (TAB_SCREENS.includes(screen)) setActiveTab(screen)
  }, [])

  const goBack = useCallback(() => {
    setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev)
  }, [])

  const switchTab = useCallback((tab) => {
    setActiveTab(tab)
    setStack([{ screen: tab, params: {} }])
  }, [])

  const onAddToCart = useCallback((item) => {
    setCart(prev => [...prev, item])
  }, [])

  const onUpdateCart = useCallback((action, item) => {
    if (action === 'add') {
      setCart(prev => [...prev, item])
    } else if (action === 'remove') {
      setCart(prev => {
        const idx = prev.findLastIndex(i => i.id === item.id)
        if (idx === -1) return prev
        return [...prev.slice(0, idx), ...prev.slice(idx + 1)]
      })
    }
  }, [])

  const onClearCart = useCallback(() => setCart([]), [])

  const showBottomNav = !['splash', 'booking', 'checkout'].includes(current.screen)

  const sharedProps = {
    navigate,
    goBack,
    params: current.params,
  }

  const renderScreen = () => {
    switch (current.screen) {
      case 'splash':
        return <SplashScreen onComplete={() => navigate('home')} />
      case 'home':
        return <HomeScreen {...sharedProps} cartCount={cart.length} />
      case 'search':
        return <SearchScreen {...sharedProps} />
      case 'detail':
        return <DetailScreen {...sharedProps} onAddToCart={onAddToCart} />
      case 'booking':
        return <BookingScreen {...sharedProps} />
      case 'cart':
        return <CartScreen {...sharedProps} cart={cart} onUpdateCart={onUpdateCart} onClearCart={onClearCart} />
      case 'checkout':
        return <CheckoutScreen {...sharedProps} />
      case 'bookings':
        return <BookingsScreen {...sharedProps} />
      case 'reviews':
      case 'review-write':
        return <ReviewsScreen {...sharedProps} />
      case 'profile':
        return <ProfileScreen {...sharedProps} />
      default:
        return <HomeScreen {...sharedProps} cartCount={cart.length} />
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center"
         style={{ background: 'linear-gradient(145deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}>
      {/* Phone frame */}
      <div
        className="relative bg-white overflow-hidden"
        style={{
          width: 390,
          height: 844,
          borderRadius: 48,
          boxShadow: '0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1), inset 0 0 0 2px rgba(255,255,255,0.05)',
        }}
      >
        {/* Status bar */}
        <div className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-8 pt-3 pb-0 pointer-events-none"
             style={{ paddingTop: 14 }}>
          <span className="text-[12px] font-semibold" style={{ color: current.screen === 'splash' ? 'white' : '#0F172A' }}>9:41</span>
          <div className="flex items-center gap-1.5">
            {/* Signal bars */}
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="6" width="3" height="6" rx="1" fill={current.screen === 'splash' ? 'white' : '#0F172A'} />
              <rect x="4.5" y="4" width="3" height="8" rx="1" fill={current.screen === 'splash' ? 'white' : '#0F172A'} />
              <rect x="9" y="2" width="3" height="10" rx="1" fill={current.screen === 'splash' ? 'white' : '#0F172A'} />
              <rect x="13.5" y="0" width="3" height="12" rx="1" fill={current.screen === 'splash' ? 'white' : '#0F172A'} />
            </svg>
            {/* WiFi */}
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
              <path d="M8 9.5C8.83 9.5 9.5 10.17 9.5 11S8.83 12.5 8 12.5 6.5 11.83 6.5 11 7.17 9.5 8 9.5z" fill={current.screen === 'splash' ? 'white' : '#0F172A'} />
              <path d="M3 6.5C4.7 4.8 6.7 4 8 4s3.3.8 5 2.5" stroke={current.screen === 'splash' ? 'white' : '#0F172A'} strokeWidth="1.5" strokeLinecap="round" fill="none" />
              <path d="M0.5 3.5C2.8 1.3 5.3 0 8 0s5.2 1.3 7.5 3.5" stroke={current.screen === 'splash' ? 'white' : '#0F172A'} strokeWidth="1.5" strokeLinecap="round" fill="none" />
            </svg>
            {/* Battery */}
            <div className="flex items-center gap-0.5">
              <div className="relative w-6 h-3 border rounded-sm" style={{ borderColor: current.screen === 'splash' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)' }}>
                <div className="absolute inset-0.5 rounded-sm" style={{ width: '80%', background: current.screen === 'splash' ? 'white' : '#0F172A' }} />
              </div>
              <div className="w-0.5 h-1.5 rounded-r-sm" style={{ background: current.screen === 'splash' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.35)' }} />
            </div>
          </div>
        </div>

        {/* Screen area */}
        <div className="absolute inset-0">
          {renderScreen()}
        </div>

        {/* Bottom nav */}
        {showBottomNav && (
          <BottomNav
            activeTab={activeTab}
            onTabChange={switchTab}
            cartCount={cart.length}
          />
        )}

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-28 h-1 rounded-full z-50 pointer-events-none"
             style={{ background: 'rgba(0,0,0,0.2)' }} />
      </div>

      {/* Desktop label */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 text-white/40 text-xs font-medium tracking-wider">
        spotly · interactive prototype
      </div>
    </div>
  )
}
