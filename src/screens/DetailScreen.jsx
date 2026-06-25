import { useState } from 'react'
import {
  ChevronLeft, Star, MapPin, Clock, Heart, Share2, Plus, Minus,
  ChevronRight, Zap, ShoppingCart, CalendarCheck, ExternalLink, ChevronDown
} from 'lucide-react'
import { reviews } from '../data/mock.js'

const TIMES_BY_DATE = {
  'Tonight': ['6:00 PM', '6:30 PM', '7:15 PM', '7:30 PM', '9:00 PM'],
  'Tomorrow': ['12:00 PM', '6:00 PM', '7:00 PM', '8:30 PM'],
  'Sat Jun 28': ['5:30 PM', '6:30 PM', '8:00 PM'],
  'Sun Jun 29': ['12:00 PM', '1:30 PM', '6:00 PM', '7:30 PM'],
}

export default function DetailScreen({ navigate, goBack, params = {}, onAddToCart }) {
  const listing = params.listing
  const [activeImage, setActiveImage] = useState(0)
  const [partySize, setPartySize] = useState(params.partySize || 2)
  const [selectedDate, setSelectedDate] = useState('Tonight')
  const [selectedTime, setSelectedTime] = useState(params.selectedSlot || null)
  const [liked, setLiked] = useState(false)
  const [cartQty, setCartQty] = useState({})

  if (!listing) return null

  const listingReviews = reviews.filter(r => r.listingId === listing.id)
  const isDelivery = ['food', 'groceries'].includes(listing.category) && listing.menu
  const isBookable = listing.timeSlots?.length > 0
  const dates = Object.keys(TIMES_BY_DATE)
  const availableSlots = TIMES_BY_DATE[selectedDate] || listing.timeSlots || []

  const addToCart = (item) => {
    setCartQty(prev => ({ ...prev, [item.id]: (prev[item.id] || 0) + 1 }))
    onAddToCart({ ...item, listingName: listing.name, listingId: listing.id })
  }

  const removeFromCart = (item) => {
    setCartQty(prev => {
      const next = { ...prev, [item.id]: Math.max(0, (prev[item.id] || 0) - 1) }
      if (next[item.id] === 0) delete next[item.id]
      return next
    })
  }

  const totalInCart = Object.values(cartQty).reduce((a, b) => a + b, 0)

  return (
    <div className="absolute inset-0 bg-white flex flex-col">
      {/* Image Carousel */}
      <div className="relative h-56 shrink-0 bg-gray-100">
        <div className="flex overflow-x-auto scrollbar-hide snap-scroll h-full">
          {(listing.images || [listing.image]).map((img, i) => (
            <div key={i} className="w-full shrink-0 snap-item h-full">
              <img src={img} alt="" className="w-full h-full object-cover" />
            </div>
          ))}
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none" />

        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-12">
          <button
            onClick={goBack}
            className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
          >
            <ChevronLeft size={20} className="text-text-dark" />
          </button>
          <div className="flex gap-2">
            <button
              onClick={() => setLiked(l => !l)}
              className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm"
            >
              <Heart size={17} fill={liked ? '#16A34A' : 'none'} className={liked ? 'text-primary' : 'text-text-dark'} />
            </button>
            <button className="w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-sm">
              <Share2 size={17} className="text-text-dark" />
            </button>
          </div>
        </div>

        {/* Image dots */}
        {(listing.images?.length || 0) > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {listing.images.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all ${i === activeImage ? 'w-4 bg-white' : 'w-1.5 bg-white/50'}`} />
            ))}
          </div>
        )}
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto scrollbar-hide" style={{ paddingBottom: 100 }}>
        {/* Info block */}
        <div className="px-5 pt-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-text-dark text-xl font-bold leading-tight">{listing.name}</h1>
              <p className="text-text-muted text-sm mt-0.5">{listing.cuisine}</p>
            </div>
            <span className="text-text-muted font-medium text-sm ml-2 mt-1">{listing.priceLevel}</span>
          </div>

          {/* Ratings row */}
          <div className="flex items-center gap-4 mt-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <Star size={15} fill="#F59E0B" className="text-amber-400" />
              <span className="font-bold text-text-dark text-sm">{listing.rating}</span>
              <span className="text-text-muted text-xs">({listing.reviewCount} reviews)</span>
            </div>
            <div className="flex items-center gap-1 text-text-muted">
              <MapPin size={13} className="text-primary" />
              <span className="text-xs">{listing.distance}</span>
            </div>
            <div className="flex items-center gap-1 text-text-muted">
              <Clock size={13} />
              <span className="text-xs">{listing.hours}</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex gap-2 mt-3 flex-wrap">
            {listing.tags?.map(tag => (
              <span key={tag} className="px-3 py-1 bg-pale-mint text-primary text-xs font-medium rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <p className="text-text-muted text-sm leading-relaxed mt-3">{listing.description}</p>

          {/* Address */}
          <div className="mt-3 flex items-start gap-2">
            <MapPin size={15} className="text-primary mt-0.5 shrink-0" />
            <span className="text-text-muted text-sm">{listing.address}</span>
          </div>

          {/* Map placeholder */}
          <div className="mt-3 rounded-2xl overflow-hidden h-28 bg-gray-100 relative">
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/light-v11/static/-74.0060,40.7128,13,0/390x200@2x?access_token=pk.placeholder`}
              alt="map"
              className="w-full h-full object-cover"
              onError={e => {
                e.target.style.display = 'none'
                e.target.parentElement.classList.add('flex', 'items-center', 'justify-center')
                e.target.parentElement.innerHTML = '<div class="flex items-center gap-2 text-text-muted"><svg xmlns=\'http://www.w3.org/2000/svg\' width=\'18\' height=\'18\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\'><path d=\'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\'/><circle cx=\'12\' cy=\'10\' r=\'3\'/></svg><span class="text-sm font-medium">View on Maps</span></div>'
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center bg-[#E8F5EE]">
              <div className="flex items-center gap-2 text-text-muted">
                <MapPin size={18} className="text-primary" />
                <span className="text-sm font-medium text-text-dark">View on Maps</span>
                <ExternalLink size={14} className="text-text-muted" />
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-2 bg-app-bg mt-4" />

        {/* Booking widget OR Menu */}
        {isBookable && !isDelivery ? (
          <div className="px-5 pt-4">
            <h2 className="font-semibold text-text-dark text-base mb-1">Make a Reservation</h2>

            {/* Points note */}
            <div className="flex items-center gap-2 bg-pale-mint rounded-xl px-3 py-2.5 mb-4">
              <Zap size={15} fill="#16A34A" className="text-primary" />
              <span className="text-primary text-xs font-semibold">You'll earn {listing.pointsEarned} Spotly Points with this booking</span>
            </div>

            {/* Party size */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-text-dark font-medium text-sm">Party size</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setPartySize(p => Math.max(1, p - 1))}
                  className="w-8 h-8 border-2 border-gray-200 rounded-full flex items-center justify-center"
                >
                  <Minus size={14} className="text-text-dark" />
                </button>
                <span className="font-bold text-text-dark w-4 text-center">{partySize}</span>
                <button
                  onClick={() => setPartySize(p => Math.min(20, p + 1))}
                  className="w-8 h-8 bg-primary rounded-full flex items-center justify-center"
                >
                  <Plus size={14} className="text-white" />
                </button>
              </div>
            </div>

            {/* Date selector */}
            <div className="mb-4">
              <span className="text-text-dark font-medium text-sm block mb-2">Select date</span>
              <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                {dates.map(d => (
                  <button
                    key={d}
                    onClick={() => { setSelectedDate(d); setSelectedTime(null) }}
                    className={`shrink-0 px-4 py-2 rounded-xl border text-xs font-semibold transition-all ${
                      selectedDate === d ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-200'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Time slots */}
            <div>
              <span className="text-text-dark font-medium text-sm block mb-2">Available times</span>
              <div className="flex gap-2 flex-wrap">
                {availableSlots.map(slot => (
                  <button
                    key={slot}
                    onClick={() => setSelectedTime(slot)}
                    className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                      selectedTime === slot
                        ? 'bg-primary text-white border-primary shadow-md'
                        : 'bg-pale-mint text-primary border-pale-mint hover:border-primary'
                    }`}
                  >
                    {slot}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Menu / Product list */
          listing.menu && (
            <div className="px-5 pt-4">
              <h2 className="font-semibold text-text-dark text-base mb-4">
                {listing.category === 'groceries' ? 'Available Items' : 'Menu Highlights'}
              </h2>
              <div className="flex flex-col gap-3">
                {listing.menu.map(item => (
                  <div key={item.id} className="flex items-center gap-3 bg-app-bg rounded-2xl p-3">
                    <img src={item.image} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text-dark text-sm leading-tight">{item.name}</p>
                      <p className="text-text-muted text-xs mt-0.5 line-clamp-1">{item.desc}</p>
                      <p className="text-primary font-bold text-sm mt-1">${item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {cartQty[item.id] > 0 && (
                        <>
                          <button onClick={() => removeFromCart(item)} className="w-7 h-7 border-2 border-gray-200 rounded-full flex items-center justify-center">
                            <Minus size={12} />
                          </button>
                          <span className="font-bold text-sm w-4 text-center">{cartQty[item.id]}</span>
                        </>
                      )}
                      <button
                        onClick={() => addToCart(item)}
                        className="w-7 h-7 bg-primary rounded-full flex items-center justify-center active:scale-95"
                      >
                        <Plus size={14} className="text-white" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}

        {/* Divider */}
        <div className="h-2 bg-app-bg mt-5" />

        {/* Reviews */}
        <div className="px-5 pt-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-text-dark text-base">Reviews</h2>
            <div className="flex items-center gap-1">
              <Star size={14} fill="#F59E0B" className="text-amber-400" />
              <span className="font-bold text-text-dark text-sm">{listing.rating}</span>
              <span className="text-text-muted text-xs">({listing.reviewCount})</span>
            </div>
          </div>

          {listingReviews.length > 0 ? (
            <div className="flex flex-col gap-4">
              {listingReviews.map(review => (
                <div key={review.id} className="bg-app-bg rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <img src={review.avatar} alt={review.user} className="w-8 h-8 rounded-full object-cover" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-dark text-sm">{review.user}</span>
                        {review.verified && (
                          <span className="text-[10px] text-primary font-semibold bg-pale-mint px-1.5 py-0.5 rounded-full">✓ Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={10} fill={i < review.rating ? '#F59E0B' : '#E5E7EB'} className={i < review.rating ? 'text-amber-400' : 'text-gray-200'} />
                        ))}
                        <span className="text-[10px] text-text-muted ml-1">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-text-muted text-xs leading-relaxed">{review.text}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-app-bg rounded-2xl p-6 text-center">
              <p className="text-text-muted text-sm">No reviews yet. Be the first!</p>
            </div>
          )}
        </div>
      </div>

      {/* Fixed CTA */}
      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4">
        {isDelivery && totalInCart > 0 ? (
          <button
            onClick={() => navigate('cart')}
            className="w-full bg-primary text-white font-semibold py-4 rounded-2xl flex items-center justify-center gap-2"
          >
            <ShoppingCart size={18} />
            View Cart ({totalInCart} item{totalInCart !== 1 ? 's' : ''}) · Go to Cart
          </button>
        ) : isBookable ? (
          <button
            onClick={() => {
              if (selectedTime) {
                navigate('booking', { listing, partySize, selectedSlot: selectedTime, selectedDate })
              }
            }}
            disabled={!selectedTime}
            className={`w-full font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all ${
              selectedTime ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted cursor-not-allowed'
            }`}
          >
            <CalendarCheck size={18} />
            {selectedTime ? `Reserve for ${selectedTime}` : 'Select a time to reserve'}
          </button>
        ) : (
          <button className="w-full bg-primary text-white font-semibold py-4 rounded-2xl">
            Order Now
          </button>
        )}
      </div>
    </div>
  )
}
