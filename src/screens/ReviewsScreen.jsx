import { useState } from 'react'
import { Star, ChevronLeft, Check, Camera, X } from 'lucide-react'
import { allReviews, listings } from '../data/mock.js'

function StarPicker({ rating, onChange }) {
  const [hover, setHover] = useState(0)
  return (
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          onMouseEnter={() => setHover(s)}
          onMouseLeave={() => setHover(0)}
          onClick={() => onChange(s)}
          className="p-1"
        >
          <Star
            size={32}
            fill={(hover || rating) >= s ? '#F59E0B' : 'none'}
            className={(hover || rating) >= s ? 'text-amber-400' : 'text-gray-300'}
          />
        </button>
      ))}
    </div>
  )
}

export default function ReviewsScreen({ navigate, params = {}, goBack }) {
  const [activeTab, setActiveTab] = useState(params.showWrite ? 'write' : 'browse')
  const [selectedListing, setSelectedListing] = useState(null)
  const [rating, setRating] = useState(0)
  const [text, setText] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = () => {
    if (rating > 0 && text.length >= 20) setSubmitted(true)
  }

  if (submitted) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col items-center justify-center px-6 text-center">
        <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-5 shadow-xl" style={{ boxShadow: '0 0 0 12px #E8F5EE' }}>
          <Check size={36} strokeWidth={3} className="text-white" />
        </div>
        <h2 className="font-bold text-text-dark text-xl mb-2">Review Submitted!</h2>
        <p className="text-text-muted text-sm mb-6">Thanks for sharing your experience. Your review helps the Spotly community.</p>
        <div className="bg-pale-mint rounded-2xl p-4 w-full flex items-center gap-3 mb-6">
          <Star size={20} fill="#F59E0B" className="text-amber-400 shrink-0" />
          <p className="text-primary font-semibold text-sm">+25 Spotly Points for your review!</p>
        </div>
        <button onClick={() => { setSubmitted(false); setActiveTab('browse'); setRating(0); setText(''); setSelectedListing(null) }}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm">
          Back to Reviews
        </button>
      </div>
    )
  }

  return (
    <div className="absolute inset-0 bg-app-bg flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4">
        <h1 className="text-text-dark text-2xl font-bold mb-4">Reviews</h1>
        <div className="bg-app-bg rounded-2xl p-1 flex">
          <button
            onClick={() => setActiveTab('browse')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'browse' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            Browse
          </button>
          <button
            onClick={() => setActiveTab('write')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === 'write' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            Leave a Review
          </button>
        </div>
      </div>

      {/* Browse tab */}
      {activeTab === 'browse' && (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-24">
          <div className="flex flex-col gap-4">
            {allReviews.map(review => {
              const listing = listings.find(l => l.id === review.listingId)
              return (
                <div key={review.id} className="bg-white rounded-2xl p-4 shadow-card">
                  {/* Listing mini card */}
                  {listing && (
                    <button
                      onClick={() => navigate('detail', { listing })}
                      className="flex items-center gap-2 mb-3 w-full"
                    >
                      <img src={listing.image} alt={listing.name} className="w-10 h-10 rounded-xl object-cover" />
                      <div className="text-left">
                        <p className="font-semibold text-text-dark text-sm">{listing.name}</p>
                        <p className="text-text-muted text-[11px]">{listing.cuisine}</p>
                      </div>
                    </button>
                  )}

                  <div className="h-px bg-gray-100 mb-3" />

                  {/* Reviewer */}
                  <div className="flex items-center gap-3 mb-2">
                    <img src={review.avatar} alt={review.user} className="w-9 h-9 rounded-full object-cover" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-text-dark text-sm">{review.user}</span>
                        {review.verified && (
                          <span className="text-[10px] text-primary font-semibold bg-pale-mint px-2 py-0.5 rounded-full flex items-center gap-0.5">
                            <Check size={9} /> Verified
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex gap-0.5">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} fill={i < review.rating ? '#F59E0B' : '#E5E7EB'} className={i < review.rating ? 'text-amber-400' : 'text-gray-200'} />
                          ))}
                        </div>
                        <span className="text-text-muted text-[11px]">{review.date}</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-text-muted text-sm leading-relaxed">{review.text}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Write review tab */}
      {activeTab === 'write' && (
        <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-24">
          {/* Eligibility note */}
          <div className="bg-pale-mint rounded-2xl p-4 flex gap-3 mb-5">
            <Check size={18} className="text-primary mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold text-primary text-sm">Verified reviews only</p>
              <p className="text-text-muted text-xs mt-0.5">Only guests who have completed a booking can leave a review. This keeps our community authentic.</p>
            </div>
          </div>

          {/* Select listing */}
          <div className="mb-5">
            <h3 className="font-semibold text-text-dark text-sm mb-3">Which venue are you reviewing?</h3>
            <div className="flex flex-col gap-2">
              {listings.slice(0, 5).map(l => (
                <button
                  key={l.id}
                  onClick={() => setSelectedListing(l)}
                  className={`flex items-center gap-3 p-3 rounded-2xl border-2 transition-all text-left ${
                    selectedListing?.id === l.id ? 'border-primary bg-pale-mint' : 'border-gray-100 bg-white'
                  }`}
                >
                  <img src={l.image} alt={l.name} className="w-12 h-12 rounded-xl object-cover shrink-0" />
                  <div className="flex-1">
                    <p className="font-semibold text-text-dark text-sm">{l.name}</p>
                    <p className="text-text-muted text-xs">{l.cuisine}</p>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                    selectedListing?.id === l.id ? 'border-primary bg-primary' : 'border-gray-300'
                  }`}>
                    {selectedListing?.id === l.id && <Check size={10} className="text-white" strokeWidth={3} />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Rating */}
          <div className="mb-5">
            <h3 className="font-semibold text-text-dark text-sm mb-3">Your rating</h3>
            <StarPicker rating={rating} onChange={setRating} />
            {rating > 0 && (
              <p className="text-text-muted text-xs mt-2">
                {['', 'Poor', 'Fair', 'Good', 'Very Good', 'Excellent!'][rating]}
              </p>
            )}
          </div>

          {/* Review text */}
          <div className="mb-5">
            <h3 className="font-semibold text-text-dark text-sm mb-2">Your review</h3>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              placeholder="Tell others about your experience — food quality, service, atmosphere, value…"
              rows={5}
              className="w-full bg-white border-2 border-gray-100 rounded-2xl px-4 py-3 text-sm text-text-dark placeholder:text-text-muted outline-none resize-none focus:border-primary transition-colors"
            />
            <p className={`text-xs mt-1 text-right ${text.length < 20 ? 'text-text-muted' : 'text-primary'}`}>
              {text.length}/20 min characters
            </p>
          </div>

          {/* Add photo */}
          <button className="w-full border-2 border-dashed border-gray-200 rounded-2xl py-4 flex items-center justify-center gap-2 text-text-muted text-sm font-medium mb-5">
            <Camera size={18} />
            Add photos (optional)
          </button>

          <button
            onClick={handleSubmit}
            disabled={!selectedListing || rating === 0 || text.length < 20}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
              selectedListing && rating > 0 && text.length >= 20
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-text-muted cursor-not-allowed'
            }`}
          >
            Submit Review
          </button>
        </div>
      )}
    </div>
  )
}
