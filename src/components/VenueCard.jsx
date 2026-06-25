import { Star, MapPin, Clock, Heart } from 'lucide-react'
import { useState } from 'react'

export default function VenueCard({ listing, onCardClick, onSlotClick, compact = false }) {
  const [liked, setLiked] = useState(false)

  const categoryColor = {
    food: 'bg-orange-100 text-orange-600',
    groceries: 'bg-emerald-100 text-emerald-600',
    events: 'bg-purple-100 text-purple-600',
    experiences: 'bg-blue-100 text-blue-600',
  }

  return (
    <div
      className="bg-white rounded-2xl shadow-card overflow-hidden cursor-pointer active:scale-[0.98] transition-transform duration-150"
      onClick={() => onCardClick(listing)}
    >
      {/* Image */}
      <div className="relative h-40">
        <img
          src={listing.image}
          alt={listing.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <button
          onClick={e => { e.stopPropagation(); setLiked(l => !l) }}
          className="absolute top-3 right-3 w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
        >
          <Heart size={16} fill={liked ? '#16A34A' : 'none'} className={liked ? 'text-primary' : 'text-text-muted'} />
        </button>
        <div className="absolute top-3 left-3">
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${categoryColor[listing.category] || 'bg-gray-100 text-gray-600'}`}>
            {listing.cuisine.split(' · ')[0]}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-text-dark text-sm leading-tight">{listing.name}</h3>
          <span className="text-text-muted text-xs ml-2 shrink-0">{listing.priceLevel}</span>
        </div>
        <p className="text-text-muted text-xs mb-2 leading-relaxed line-clamp-1">{listing.cuisine}</p>

        <div className="flex items-center gap-3 mb-3">
          <div className="flex items-center gap-1">
            <Star size={12} fill="#F59E0B" className="text-amber-400" />
            <span className="text-xs font-semibold text-text-dark">{listing.rating}</span>
            <span className="text-xs text-text-muted">({listing.reviewCount})</span>
          </div>
          <div className="flex items-center gap-1 text-text-muted">
            <MapPin size={11} />
            <span className="text-xs">{listing.distance}</span>
          </div>
          {listing.eta && (
            <div className="flex items-center gap-1 text-text-muted">
              <Clock size={11} />
              <span className="text-xs">{listing.eta}</span>
            </div>
          )}
        </div>

        {/* Time slots */}
        {listing.timeSlots && listing.timeSlots.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            {listing.timeSlots.slice(0, 4).map(slot => (
              <button
                key={slot}
                onClick={e => { e.stopPropagation(); onSlotClick(listing, slot) }}
                className="px-3 py-1.5 bg-pale-mint text-primary text-xs font-semibold rounded-lg hover:bg-primary hover:text-white transition-colors duration-150 active:scale-95"
              >
                {slot}
              </button>
            ))}
            {listing.timeSlots.length > 4 && (
              <span className="px-2 py-1.5 text-text-muted text-xs">+{listing.timeSlots.length - 4}</span>
            )}
          </div>
        )}

        {/* For delivery/grocery */}
        {listing.category === 'groceries' && (
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs bg-green-50 text-primary font-medium px-2 py-1 rounded-lg">Free delivery $40+</span>
            <span className="text-xs text-text-muted">{listing.eta} away</span>
          </div>
        )}
      </div>
    </div>
  )
}
