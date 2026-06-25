import { Search, ShoppingBag, Ticket, Star, MoreHorizontal, Utensils, Bell, ShoppingCart, ChevronRight, MapPin, Zap } from 'lucide-react'
import { listings } from '../data/mock.js'
import VenueCard from '../components/VenueCard.jsx'

const categories = [
  { id: 'food', label: 'Food', Icon: Utensils, bg: 'bg-orange-50', iconColor: 'text-orange-500', borderColor: 'border-orange-100' },
  { id: 'groceries', label: 'Groceries', Icon: ShoppingBag, bg: 'bg-emerald-50', iconColor: 'text-emerald-500', borderColor: 'border-emerald-100' },
  { id: 'events', label: 'Events', Icon: Ticket, bg: 'bg-purple-50', iconColor: 'text-purple-500', borderColor: 'border-purple-100' },
  { id: 'reviews', label: 'Reviews', Icon: Star, bg: 'bg-yellow-50', iconColor: 'text-yellow-500', borderColor: 'border-yellow-100' },
  { id: 'more', label: 'More', Icon: MoreHorizontal, bg: 'bg-gray-50', iconColor: 'text-gray-400', borderColor: 'border-gray-100' },
]

const exploreTiles = [
  { id: 'restaurants', label: 'Restaurants', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop', cat: 'food' },
  { id: 'groceries', label: 'Groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=300&h=200&fit=crop', cat: 'groceries' },
  { id: 'events', label: 'Events', image: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=300&h=200&fit=crop', cat: 'events' },
  { id: 'drinks', label: 'Experiences', image: 'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?w=300&h=200&fit=crop', cat: 'experiences' },
]

export default function HomeScreen({ navigate, cartCount }) {
  const popular = listings.filter(l => l.popular)

  return (
    <div className="absolute inset-0 overflow-y-auto overflow-x-hidden scrollbar-hide bg-app-bg" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-5">
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-text-muted text-sm font-medium">Hi, Tinashe 👋</p>
            <h1 className="text-text-dark text-2xl font-bold leading-tight">Where to today?</h1>
          </div>
          <div className="flex items-center gap-2">
            {cartCount > 0 && (
              <button
                onClick={() => navigate('cart')}
                className="relative w-10 h-10 bg-pale-mint rounded-full flex items-center justify-center"
              >
                <ShoppingCart size={18} className="text-primary" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </button>
            )}
            <button className="relative w-10 h-10 bg-pale-mint rounded-full flex items-center justify-center">
              <Bell size={18} className="text-primary" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full" />
            </button>
          </div>
        </div>

        {/* Search bar */}
        <button
          onClick={() => navigate('search')}
          className="mt-4 w-full flex items-center gap-3 bg-app-bg border border-gray-200 rounded-2xl px-4 py-3.5 text-left"
        >
          <Search size={18} className="text-text-muted shrink-0" />
          <span className="text-text-muted text-sm">Search for restaurants, groceries, events…</span>
        </button>
      </div>

      {/* Location bar */}
      <div className="px-5 py-2.5 bg-white border-b border-gray-100 flex items-center gap-2">
        <MapPin size={14} className="text-primary" />
        <span className="text-xs font-medium text-text-dark">Lower Manhattan, NYC</span>
        <ChevronRight size={12} className="text-text-muted" />
      </div>

      {/* Categories */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-dark font-semibold text-base">Browse Categories</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 -mx-1 px-1">
          {categories.map(({ id, label, Icon, bg, iconColor, borderColor }) => (
            <button
              key={id}
              onClick={() => id !== 'more' ? navigate('search', { category: id }) : null}
              className="flex flex-col items-center gap-2 shrink-0"
            >
              <div className={`w-14 h-14 ${bg} border ${borderColor} rounded-2xl flex items-center justify-center active:scale-90 transition-transform`}>
                <Icon size={24} className={iconColor} strokeWidth={1.8} />
              </div>
              <span className="text-text-dark text-[11px] font-medium">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Points banner */}
      <div className="mx-5 mt-5 rounded-2xl p-4 flex items-center gap-3" style={{ background: 'linear-gradient(135deg, #0D1B2A, #1a3a28)' }}>
        <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shrink-0">
          <Zap size={18} fill="white" className="text-white" />
        </div>
        <div className="flex-1">
          <p className="text-white text-xs font-medium">You have <span className="text-accent font-bold">1,240 Spotly Points</span></p>
          <p className="text-[#64748B] text-[11px] mt-0.5">Book tonight to earn more rewards →</p>
        </div>
      </div>

      {/* Popular Near You */}
      <div className="mt-5">
        <div className="px-5 flex items-center justify-between mb-3">
          <h2 className="text-text-dark font-semibold text-base">Popular Near You</h2>
          <button onClick={() => navigate('search')} className="text-primary text-xs font-semibold flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-2 snap-scroll">
          {popular.map(listing => (
            <div key={listing.id} className="w-64 shrink-0 snap-item">
              <VenueCard
                listing={listing}
                onCardClick={l => navigate('detail', { listing: l })}
                onSlotClick={(l, slot) => navigate('booking', { listing: l, selectedSlot: slot })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Explore Categories */}
      <div className="mt-5 px-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-dark font-semibold text-base">Explore Categories</h2>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {exploreTiles.map(({ id, label, image, cat }) => (
            <button
              key={id}
              onClick={() => navigate('search', { category: cat })}
              className="relative rounded-2xl overflow-hidden h-28 shadow-card active:scale-[0.97] transition-transform"
            >
              <img src={image} alt={label} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-3 left-3 text-white font-semibold text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Trending */}
      <div className="mt-5 px-5 pb-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-text-dark font-semibold text-base">Trending This Week</h2>
          <button onClick={() => navigate('search')} className="text-primary text-xs font-semibold flex items-center gap-0.5">
            See all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex flex-col gap-3">
          {listings.slice(0, 3).map(listing => (
            <button
              key={listing.id}
              onClick={() => navigate('detail', { listing })}
              className="bg-white rounded-2xl p-3 flex items-center gap-3 shadow-card active:scale-[0.98] transition-transform"
            >
              <img src={listing.image} alt={listing.name} className="w-14 h-14 rounded-xl object-cover shrink-0" />
              <div className="flex-1 text-left">
                <p className="font-semibold text-text-dark text-sm">{listing.name}</p>
                <p className="text-text-muted text-xs">{listing.cuisine}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[11px] font-bold text-text-dark">⭐ {listing.rating}</span>
                  <span className="text-text-muted text-[11px]">{listing.distance}</span>
                  <span className="text-text-muted text-[11px]">{listing.priceLevel}</span>
                </div>
              </div>
              <ChevronRight size={16} className="text-text-muted shrink-0" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
