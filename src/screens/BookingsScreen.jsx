import { useState } from 'react'
import { Calendar, Clock, Users, ChevronRight, X, Check, Ticket, Utensils, MapPin } from 'lucide-react'
import { upcomingBookings, pastBookings } from '../data/mock.js'

export default function BookingsScreen({ navigate }) {
  const [tab, setTab] = useState('upcoming')
  const [cancelId, setCancelId] = useState(null)

  const bookings = tab === 'upcoming' ? upcomingBookings : pastBookings

  const typeIcon = (type) => {
    if (type === 'restaurant') return <Utensils size={14} className="text-primary" />
    if (type === 'event') return <Ticket size={14} className="text-purple-500" />
    return <MapPin size={14} className="text-blue-500" />
  }

  const statusColor = {
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-gray-100 text-text-muted',
    cancelled: 'bg-red-50 text-red-500',
  }

  return (
    <div className="absolute inset-0 bg-app-bg flex flex-col">
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-4">
        <h1 className="text-text-dark text-2xl font-bold mb-4">Bookings</h1>
        <div className="bg-app-bg rounded-2xl p-1 flex">
          <button
            onClick={() => setTab('upcoming')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'upcoming' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setTab('past')}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              tab === 'past' ? 'bg-white text-primary shadow-sm' : 'text-text-muted'
            }`}
          >
            Past ({pastBookings.length})
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hide px-4 pt-4 pb-24">
        {bookings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <div className="w-16 h-16 bg-pale-mint rounded-full flex items-center justify-center">
              <Calendar size={28} className="text-primary" />
            </div>
            <p className="font-semibold text-text-dark">No bookings yet</p>
            <p className="text-text-muted text-sm text-center">Explore restaurants, events and experiences to get started</p>
            <button onClick={() => navigate('search')} className="bg-primary text-white px-6 py-3 rounded-2xl text-sm font-semibold mt-2">
              Explore Now
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {bookings.map(booking => (
              <div key={booking.id} className="bg-white rounded-2xl overflow-hidden shadow-card">
                <div className="relative h-28">
                  <img src={booking.listingImage} alt={booking.listingName} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <p className="text-white font-bold text-base leading-tight">{booking.listingName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        {typeIcon(booking.type)}
                        <span className="text-white/80 text-xs capitalize">{booking.type}</span>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${statusColor[booking.status]}`}>
                      {booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="px-4 py-3">
                  <div className="flex items-center gap-4 text-text-muted text-xs mb-3">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} className="text-primary" />
                      <span>{booking.date}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock size={12} className="text-primary" />
                      <span>{booking.time}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={12} className="text-primary" />
                      <span>{booking.partySize} guests</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <div className="bg-app-dark rounded-xl px-3 py-1.5">
                      <span className="text-accent font-bold text-xs tracking-widest">{booking.confirmationCode}</span>
                    </div>
                    <span className="text-primary text-xs font-semibold">+{booking.points} pts</span>
                  </div>

                  {/* Actions */}
                  {tab === 'upcoming' && (
                    <div className="flex gap-2">
                      <button className="flex-1 bg-pale-mint text-primary text-xs font-semibold py-2.5 rounded-xl">
                        Modify
                      </button>
                      <button
                        onClick={() => setCancelId(booking.id)}
                        className="flex-1 bg-red-50 text-red-500 text-xs font-semibold py-2.5 rounded-xl"
                      >
                        Cancel
                      </button>
                      <button className="flex-1 bg-primary text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1">
                        Details <ChevronRight size={12} />
                      </button>
                    </div>
                  )}

                  {tab === 'past' && (
                    <div className="flex gap-2">
                      {booking.canReview ? (
                        <button onClick={() => navigate('review-write', { booking })} className="flex-1 bg-primary text-white text-xs font-semibold py-2.5 rounded-xl">
                          Leave a Review
                        </button>
                      ) : (
                        <div className="flex-1 bg-pale-mint text-primary text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1">
                          <Check size={12} /> Reviewed
                        </div>
                      )}
                      <button className="flex-1 bg-app-bg text-text-dark text-xs font-semibold py-2.5 rounded-xl">
                        Rebook
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cancel modal */}
      {cancelId && (
        <div className="absolute inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setCancelId(null)} />
          <div className="relative w-full bg-white rounded-t-3xl p-5 slide-up">
            <div className="flex justify-center mb-1"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            <div className="flex items-center justify-between py-3 mb-3">
              <h3 className="font-semibold text-text-dark text-lg">Cancel Reservation?</h3>
              <button onClick={() => setCancelId(null)}><X size={20} className="text-text-muted" /></button>
            </div>
            <p className="text-text-muted text-sm mb-6">Cancellations made more than 2 hours before your reservation are free of charge.</p>
            <button onClick={() => setCancelId(null)} className="w-full bg-red-500 text-white py-4 rounded-2xl font-semibold text-sm mb-3">
              Yes, Cancel Reservation
            </button>
            <button onClick={() => setCancelId(null)} className="w-full bg-app-bg text-text-dark py-4 rounded-2xl font-semibold text-sm">
              Keep Reservation
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
