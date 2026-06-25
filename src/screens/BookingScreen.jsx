import { useState } from 'react'
import { ChevronLeft, Calendar, Clock, Users, Zap, Check, Plus, Minus, Download, Share2, X } from 'lucide-react'

const STEPS = ['Details', 'Confirm', 'Done']

export default function BookingScreen({ navigate, goBack, params = {} }) {
  const { listing, selectedSlot, selectedDate = 'Tonight', partySize: initParty = 2 } = params
  const [step, setStep] = useState(selectedSlot ? 1 : 0)
  const [partySize, setPartySize] = useState(initParty)
  const [date, setDate] = useState(selectedDate)
  const [time, setTime] = useState(selectedSlot || null)
  const [specialRequests, setSpecialRequests] = useState('')
  const [booked, setBooked] = useState(false)

  if (!listing) return null

  const confirmationCode = `SPT-${Math.floor(1000 + Math.random() * 9000)}`
  const dates = ['Tonight', 'Tomorrow', 'Sat Jun 28', 'Sun Jun 29', 'Mon Jun 30']
  const timeSlots = listing.timeSlots || ['6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM', '9:00 PM']

  const handleConfirm = () => {
    setBooked(true)
    setStep(2)
  }

  // Step 0: Select details
  if (step === 0) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        {/* Header */}
        <div className="px-5 pt-14 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={goBack} className="w-9 h-9 bg-app-bg rounded-full flex items-center justify-center">
              <ChevronLeft size={20} className="text-text-dark" />
            </button>
            <h1 className="font-bold text-text-dark text-lg">Reserve a Table</h1>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-all ${
                  i < step ? 'bg-primary border-primary text-white'
                  : i === step ? 'border-primary text-primary bg-white'
                  : 'border-gray-200 text-text-muted bg-white'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-5 pb-24">
          {/* Venue summary */}
          <div className="flex items-center gap-3 bg-app-bg rounded-2xl p-3 mb-6">
            <img src={listing.image} alt={listing.name} className="w-14 h-14 rounded-xl object-cover" />
            <div>
              <p className="font-semibold text-text-dark text-sm">{listing.name}</p>
              <p className="text-text-muted text-xs">{listing.cuisine}</p>
            </div>
          </div>

          {/* Party size */}
          <div className="mb-6">
            <h3 className="font-semibold text-text-dark text-sm mb-3 flex items-center gap-2">
              <Users size={16} className="text-primary" /> Party size
            </h3>
            <div className="flex items-center gap-4">
              <button onClick={() => setPartySize(p => Math.max(1, p - 1))}
                className="w-10 h-10 border-2 border-gray-200 rounded-full flex items-center justify-center">
                <Minus size={16} className="text-text-dark" />
              </button>
              <span className="font-bold text-2xl text-text-dark w-8 text-center">{partySize}</span>
              <button onClick={() => setPartySize(p => Math.min(20, p + 1))}
                className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                <Plus size={16} className="text-white" />
              </button>
              <span className="text-text-muted text-sm">{partySize === 1 ? 'guest' : 'guests'}</span>
            </div>
          </div>

          {/* Date */}
          <div className="mb-6">
            <h3 className="font-semibold text-text-dark text-sm mb-3 flex items-center gap-2">
              <Calendar size={16} className="text-primary" /> Select date
            </h3>
            <div className="flex gap-2 flex-wrap">
              {dates.map(d => (
                <button key={d} onClick={() => { setDate(d); setTime(null) }}
                  className={`px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                    date === d ? 'bg-primary text-white border-primary' : 'bg-white text-text-dark border-gray-200'
                  }`}>
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Time */}
          <div className="mb-6">
            <h3 className="font-semibold text-text-dark text-sm mb-3 flex items-center gap-2">
              <Clock size={16} className="text-primary" /> Available times
            </h3>
            <div className="flex gap-2 flex-wrap">
              {timeSlots.map(slot => (
                <button key={slot} onClick={() => setTime(slot)}
                  className={`px-4 py-2.5 rounded-xl border text-sm font-semibold transition-all active:scale-95 ${
                    time === slot ? 'bg-primary text-white border-primary shadow-md' : 'bg-pale-mint text-primary border-pale-mint'
                  }`}>
                  {slot}
                </button>
              ))}
            </div>
          </div>

          {/* Special requests */}
          <div className="mb-6">
            <h3 className="font-semibold text-text-dark text-sm mb-2">Special requests (optional)</h3>
            <textarea
              value={specialRequests}
              onChange={e => setSpecialRequests(e.target.value)}
              placeholder="Dietary requirements, celebrations, seating preferences…"
              rows={3}
              className="w-full bg-app-bg border border-gray-200 rounded-xl px-4 py-3 text-sm text-text-dark placeholder:text-text-muted outline-none resize-none focus:border-primary transition-colors"
            />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={() => time && setStep(1)}
            disabled={!time}
            className={`w-full py-4 rounded-2xl font-semibold text-sm transition-all ${
              time ? 'bg-primary text-white' : 'bg-gray-100 text-text-muted cursor-not-allowed'
            }`}
          >
            {time ? 'Continue to Confirm' : 'Select a time to continue'}
          </button>
        </div>
      </div>
    )
  }

  // Step 1: Confirm
  if (step === 1) {
    return (
      <div className="absolute inset-0 bg-white flex flex-col">
        <div className="px-5 pt-14 pb-4 border-b border-gray-100">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={() => setStep(0)} className="w-9 h-9 bg-app-bg rounded-full flex items-center justify-center">
              <ChevronLeft size={20} className="text-text-dark" />
            </button>
            <h1 className="font-bold text-text-dark text-lg">Confirm Booking</h1>
          </div>
          <div className="flex items-center gap-0">
            {STEPS.map((s, i) => (
              <div key={s} className="flex items-center flex-1">
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold border-2 transition-all ${
                  i < step ? 'bg-primary border-primary text-white'
                  : i === step ? 'border-primary text-primary bg-white'
                  : 'border-gray-200 text-text-muted bg-white'
                }`}>
                  {i < step ? <Check size={14} /> : i + 1}
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-1 ${i < step ? 'bg-primary' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-hide px-5 pt-5 pb-32">
          <img src={listing.image} alt={listing.name} className="w-full h-40 object-cover rounded-2xl mb-5" />

          <h2 className="font-bold text-text-dark text-xl mb-1">{listing.name}</h2>
          <p className="text-text-muted text-sm mb-5">{listing.address}</p>

          <div className="bg-app-bg rounded-2xl p-4 flex flex-col gap-4 mb-5">
            {[
              { icon: Users, label: 'Party size', value: `${partySize} ${partySize === 1 ? 'guest' : 'guests'}` },
              { icon: Calendar, label: 'Date', value: date },
              { icon: Clock, label: 'Time', value: time || selectedSlot },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-text-muted">
                  <Icon size={16} className="text-primary" />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="font-semibold text-text-dark text-sm">{value}</span>
              </div>
            ))}
          </div>

          {specialRequests && (
            <div className="bg-app-bg rounded-2xl p-4 mb-5">
              <p className="text-text-muted text-xs mb-1">Special requests</p>
              <p className="text-text-dark text-sm">{specialRequests}</p>
            </div>
          )}

          <div className="bg-pale-mint rounded-2xl p-4 flex items-center gap-3 mb-5">
            <Zap size={20} fill="#16A34A" className="text-primary shrink-0" />
            <div>
              <p className="font-semibold text-primary text-sm">+{listing.pointsEarned} Spotly Points</p>
              <p className="text-text-muted text-xs">Credited after your visit is complete</p>
            </div>
          </div>

          <p className="text-text-muted text-xs text-center">
            By confirming, you agree to Spotly's booking terms. Cancel up to 2 hours before your reservation for no charge.
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4">
          <button
            onClick={handleConfirm}
            className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm"
          >
            Confirm Reservation
          </button>
        </div>
      </div>
    )
  }

  // Step 2: Confirmation
  return (
    <div className="absolute inset-0 bg-white flex flex-col items-center">
      <div className="w-full flex-1 overflow-y-auto scrollbar-hide px-5 pb-24">
        {/* Success animation area */}
        <div className="flex flex-col items-center pt-16 pb-8">
          <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mb-5 shadow-lg" style={{ boxShadow: '0 0 0 12px #E8F5EE' }}>
            <Check size={36} strokeWidth={3} className="text-white" />
          </div>
          <h1 className="text-text-dark text-2xl font-bold text-center">You're booked!</h1>
          <p className="text-text-muted text-sm text-center mt-2">Your reservation is confirmed at {listing.name}</p>
        </div>

        {/* Booking card */}
        <div className="bg-app-dark rounded-3xl p-5 mb-5 overflow-hidden relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-accent to-primary" />
          <div className="flex items-center gap-3 mb-4">
            <img src={listing.image} alt={listing.name} className="w-12 h-12 rounded-xl object-cover" />
            <div>
              <p className="text-white font-semibold text-sm">{listing.name}</p>
              <p className="text-[#64748B] text-xs">{listing.cuisine}</p>
            </div>
          </div>

          <div className="h-px bg-white/10 mb-4" />

          <div className="grid grid-cols-2 gap-3 mb-4">
            {[
              { label: 'Date', value: date },
              { label: 'Time', value: time || selectedSlot },
              { label: 'Party', value: `${partySize} guests` },
              { label: 'Points', value: `+${listing.pointsEarned} pts` },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[#64748B] text-[11px]">{label}</p>
                <p className="text-white font-semibold text-sm">{value}</p>
              </div>
            ))}
          </div>

          <div className="h-px bg-white/10 mb-4 border-dashed border-t border-white/20" />

          <div className="text-center">
            <p className="text-[#64748B] text-xs mb-1">Confirmation code</p>
            <p className="text-accent text-xl font-bold tracking-widest">{confirmationCode}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mb-5">
          <button className="flex-1 bg-app-bg border border-gray-200 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-text-dark text-sm font-medium">
            <Download size={16} />
            Save Pass
          </button>
          <button className="flex-1 bg-app-bg border border-gray-200 rounded-2xl py-3.5 flex items-center justify-center gap-2 text-text-dark text-sm font-medium">
            <Share2 size={16} />
            Share
          </button>
        </div>

        <div className="bg-pale-mint rounded-2xl p-4 flex items-center gap-3 mb-6">
          <Zap size={20} fill="#16A34A" className="text-primary shrink-0" />
          <div>
            <p className="font-semibold text-primary text-sm">+{listing.pointsEarned} points added to your balance</p>
            <p className="text-text-muted text-xs">After your visit is verified</p>
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-5 py-4">
        <button
          onClick={() => navigate('home')}
          className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm"
        >
          Back to Home
        </button>
      </div>
    </div>
  )
}
