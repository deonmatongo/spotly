import { Home, Search, CalendarCheck, Star, User } from 'lucide-react'

const tabs = [
  { id: 'home', label: 'Home', Icon: Home },
  { id: 'search', label: 'Search', Icon: Search },
  { id: 'bookings', label: 'Bookings', Icon: CalendarCheck },
  { id: 'reviews', label: 'Reviews', Icon: Star },
  { id: 'profile', label: 'Profile', Icon: User },
]

export default function BottomNav({ activeTab, onTabChange, cartCount }) {
  return (
    <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-40"
         style={{ paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
      <div className="flex items-center justify-around px-1 pt-2 pb-3">
        {tabs.map(({ id, label, Icon }) => {
          const active = activeTab === id
          return (
            <button
              key={id}
              onClick={() => onTabChange(id)}
              className="flex flex-col items-center gap-0.5 min-w-[52px] relative"
            >
              <div className={`p-1.5 rounded-xl transition-all duration-200 ${
                active ? 'bg-pale-mint' : ''
              }`}>
                <Icon
                  size={22}
                  strokeWidth={active ? 2.5 : 1.8}
                  className={`transition-colors duration-200 ${
                    active ? 'text-primary' : 'text-text-muted'
                  }`}
                />
                {id === 'bookings' && cartCount > 0 && (
                  <span className="absolute top-0 right-0 w-4 h-4 bg-primary text-white text-[9px] font-semibold rounded-full flex items-center justify-center -translate-y-0.5 translate-x-0.5">
                    {cartCount}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium transition-colors duration-200 ${
                active ? 'text-primary' : 'text-text-muted'
              }`}>
                {label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
