import { useState, useMemo } from 'react'
import { Search, SlidersHorizontal, X, ChevronDown, Users, Calendar, Clock, Star, MapPin, Check } from 'lucide-react'
import { listings } from '../data/mock.js'
import VenueCard from '../components/VenueCard.jsx'

const CATEGORIES = ['All', 'Food', 'Groceries', 'Events', 'Experiences']
const PRICE_LEVELS = ['$', '$$', '$$$', '$$$$']
const DIETARY = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher']
const FEATURES = ['Outdoor Seating', 'Delivery', 'Group-Friendly']
const DISTANCES = ['< 0.5 mi', '< 1 mi', '< 2 mi', 'Any']

export default function SearchScreen({ navigate, params = {} }) {
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState(
    params.category ? (params.category.charAt(0).toUpperCase() + params.category.slice(1)) : 'All'
  )
  const [showFilters, setShowFilters] = useState(false)
  const [partySize, setPartySize] = useState(2)
  const [selectedDate, setSelectedDate] = useState('Tonight')
  const [selectedTime, setSelectedTime] = useState('Any time')
  const [selectedPrices, setSelectedPrices] = useState([])
  const [selectedDietary, setSelectedDietary] = useState([])
  const [selectedFeatures, setSelectedFeatures] = useState([])
  const [minRating, setMinRating] = useState(0)
  const [maxDistance, setMaxDistance] = useState('Any')

  const filtered = useMemo(() => {
    return listings.filter(l => {
      const matchesQuery = !query || l.name.toLowerCase().includes(query.toLowerCase()) || l.cuisine.toLowerCase().includes(query.toLowerCase())
      const matchesCat = activeCategory === 'All' || l.category === activeCategory.toLowerCase() || l.category === activeCategory.toLowerCase() + 's'
      const matchesPrice = selectedPrices.length === 0 || selectedPrices.includes(l.priceLevel)
      const matchesRating = l.rating >= minRating
      const matchesFeatures = selectedFeatures.length === 0 || selectedFeatures.every(f => {
        const key = f.toLowerCase().replace(/ /g, '_').replace('-', '_')
        return l.features?.includes(key)
      })
      return matchesQuery && matchesCat && matchesPrice && matchesRating && matchesFeatures
    })
  }, [query, activeCategory, selectedPrices, minRating, selectedFeatures])

  const toggleArr = (arr, setArr, val) => {
    setArr(prev => prev.includes(val) ? prev.filter(v => v !== val) : [...prev, val])
  }

  const activeFilterCount = selectedPrices.length + selectedDietary.length + selectedFeatures.length + (minRating > 0 ? 1 : 0) + (maxDistance !== 'Any' ? 1 : 0)

  const dates = ['Tonight', 'Tomorrow', 'Sat Jun 28', 'Sun Jun 29', 'Mon Jun 30']
  const times = ['Any time', '12:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM']

  return (
    <div className="absolute inset-0 bg-app-bg flex flex-col">
      {/* Search Header */}
      <div className="bg-white px-4 pt-14 pb-3 z-10">
        {/* Search input */}
        <div className="flex items-center gap-2 bg-app-bg border border-gray-200 rounded-2xl px-4 py-3 mb-3">
          <Search size={18} className="text-text-muted shrink-0" />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Restaurants, groceries, events…"
            className="flex-1 bg-transparent text-text-dark text-sm outline-none placeholder:text-text-muted font-medium"
            autoFocus={!params.category}
          />
          {query && (
            <button onClick={() => setQuery('')}>
              <X size={16} className="text-text-muted" />
            </button>
          )}
        </div>

        {/* Category chips */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150 ${
                activeCategory === cat
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-text-muted border-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white border-b border-gray-100 px-4 py-2 flex items-center gap-2 overflow-x-auto scrollbar-hide">
        {/* Party size */}
        <button
          className="shrink-0 flex items-center gap-1.5 bg-app-bg border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text-dark"
          onClick={() => setPartySize(ps => ps === 8 ? 1 : ps + 1)}
        >
          <Users size={13} className="text-primary" />
          <span>{partySize} {partySize === 1 ? 'Guest' : 'Guests'}</span>
          <ChevronDown size={12} className="text-text-muted" />
        </button>

        {/* Date */}
        <div className="shrink-0 flex items-center gap-1.5 bg-app-bg border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text-dark">
          <Calendar size={13} className="text-primary" />
          <span>{selectedDate}</span>
          <ChevronDown size={12} className="text-text-muted" />
        </div>

        {/* Time */}
        <div className="shrink-0 flex items-center gap-1.5 bg-app-bg border border-gray-200 rounded-xl px-3 py-2 text-xs font-medium text-text-dark">
          <Clock size={13} className="text-primary" />
          <span>{selectedTime}</span>
          <ChevronDown size={12} className="text-text-muted" />
        </div>

        {/* Filters button */}
        <button
          onClick={() => setShowFilters(true)}
          className={`shrink-0 ml-auto flex items-center gap-1.5 border rounded-xl px-3 py-2 text-xs font-semibold transition-colors ${
            activeFilterCount > 0 ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-200'
          }`}
        >
          <SlidersHorizontal size={13} />
          Filters
          {activeFilterCount > 0 && <span className="bg-white text-primary w-4 h-4 rounded-full text-[9px] flex items-center justify-center font-bold">{activeFilterCount}</span>}
        </button>
      </div>

      {/* Results */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-24">
        <p className="text-text-muted text-xs font-medium mb-3">{filtered.length} results found</p>
        <div className="flex flex-col gap-4">
          {filtered.map(listing => (
            <VenueCard
              key={listing.id}
              listing={listing}
              onCardClick={l => navigate('detail', { listing: l })}
              onSlotClick={(l, slot) => navigate('booking', { listing: l, selectedSlot: slot, partySize })}
            />
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-16">
              <p className="text-4xl mb-3">🔍</p>
              <p className="font-semibold text-text-dark">No results found</p>
              <p className="text-text-muted text-sm mt-1">Try adjusting your filters</p>
            </div>
          )}
        </div>
      </div>

      {/* Filters Drawer */}
      {showFilters && (
        <div className="absolute inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowFilters(false)} />
          <div className="relative bg-white rounded-t-3xl max-h-[80%] overflow-y-auto scrollbar-hide slide-up">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            <div className="px-5 pb-8">
              <div className="flex items-center justify-between py-3 mb-1">
                <h3 className="font-semibold text-text-dark text-lg">Filters</h3>
                <button
                  onClick={() => {
                    setSelectedPrices([]); setSelectedDietary([]); setSelectedFeatures([]); setMinRating(0); setMaxDistance('Any')
                  }}
                  className="text-primary text-sm font-semibold"
                >
                  Clear all
                </button>
              </div>

              {/* Price Level */}
              <div className="mb-5">
                <h4 className="font-semibold text-text-dark text-sm mb-3">Price Level</h4>
                <div className="flex gap-2">
                  {PRICE_LEVELS.map(p => (
                    <button
                      key={p}
                      onClick={() => toggleArr(selectedPrices, setSelectedPrices, p)}
                      className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all ${
                        selectedPrices.includes(p) ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-200'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Min Rating */}
              <div className="mb-5">
                <h4 className="font-semibold text-text-dark text-sm mb-3">Minimum Rating: {minRating > 0 ? `${minRating}+` : 'Any'}</h4>
                <div className="flex gap-2">
                  {[0, 3.5, 4.0, 4.5].map(r => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        minRating === r ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-200'
                      }`}
                    >
                      {r === 0 ? 'Any' : <><Star size={12} fill="currentColor" /> {r}+</>}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance */}
              <div className="mb-5">
                <h4 className="font-semibold text-text-dark text-sm mb-3">Distance</h4>
                <div className="flex gap-2 flex-wrap">
                  {DISTANCES.map(d => (
                    <button
                      key={d}
                      onClick={() => setMaxDistance(d)}
                      className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${
                        maxDistance === d ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-200'
                      }`}
                    >
                      <MapPin size={12} />
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dietary */}
              <div className="mb-5">
                <h4 className="font-semibold text-text-dark text-sm mb-3">Dietary Needs</h4>
                <div className="flex gap-2 flex-wrap">
                  {DIETARY.map(d => (
                    <button
                      key={d}
                      onClick={() => toggleArr(selectedDietary, setSelectedDietary, d)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        selectedDietary.includes(d) ? 'bg-pale-mint text-primary border-primary' : 'bg-white text-text-dark border-gray-200'
                      }`}
                    >
                      {selectedDietary.includes(d) && <Check size={10} className="inline mr-1" />}
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h4 className="font-semibold text-text-dark text-sm mb-3">Features</h4>
                <div className="flex gap-2 flex-wrap">
                  {FEATURES.map(f => (
                    <button
                      key={f}
                      onClick={() => toggleArr(selectedFeatures, setSelectedFeatures, f)}
                      className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                        selectedFeatures.includes(f) ? 'bg-pale-mint text-primary border-primary' : 'bg-white text-text-dark border-gray-200'
                      }`}
                    >
                      {selectedFeatures.includes(f) && <Check size={10} className="inline mr-1" />}
                      {f}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full bg-primary text-white font-semibold py-4 rounded-2xl text-sm"
              >
                Show {filtered.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
