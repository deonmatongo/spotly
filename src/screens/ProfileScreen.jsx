import { useState } from 'react'
import { ChevronRight, Zap, Star, Bell, Shield, HelpCircle, LogOut, Edit3, Award, Gift, TrendingUp, Check } from 'lucide-react'
import { currentUser } from '../data/mock.js'

const REWARDS = [
  { id: 1, name: '$10 Off Your Next Booking', points: 500, emoji: '🎟️' },
  { id: 2, name: 'Free Delivery (1 order)', points: 250, emoji: '🛵' },
  { id: 3, name: 'Priority Reservation', points: 750, emoji: '⚡' },
  { id: 4, name: 'VIP Table Upgrade', points: 1500, emoji: '👑' },
]

const SETTINGS = [
  { icon: Bell, label: 'Notifications', sub: 'Manage alerts & reminders' },
  { icon: Shield, label: 'Privacy & Security', sub: 'Data, password, 2FA' },
  { icon: HelpCircle, label: 'Help & Support', sub: 'FAQs, live chat' },
  { icon: Star, label: 'Rate Spotly', sub: 'Tell us what you think' },
]

const TIERS = [
  { name: 'Bronze', min: 0, max: 499, color: 'text-amber-700' },
  { name: 'Silver', min: 500, max: 999, color: 'text-gray-500' },
  { name: 'Gold', min: 1000, max: 2499, color: 'text-yellow-500' },
  { name: 'Platinum', min: 2500, max: Infinity, color: 'text-cyan-500' },
]

export default function ProfileScreen({ navigate }) {
  const [redeemId, setRedeemId] = useState(null)
  const [redeemed, setRedeemed] = useState([])
  const points = currentUser.points
  const tier = TIERS.find(t => points >= t.min && points <= t.max)
  const nextTier = TIERS[TIERS.indexOf(tier) + 1]
  const progressToNext = nextTier ? Math.min(100, ((points - tier.min) / (nextTier.min - tier.min)) * 100) : 100

  return (
    <div className="absolute inset-0 bg-app-bg overflow-y-auto scrollbar-hide" style={{ paddingBottom: 80 }}>
      {/* Header */}
      <div className="bg-white px-5 pt-14 pb-6">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-text-dark text-2xl font-bold">Profile</h1>
          <button className="w-9 h-9 bg-app-bg rounded-full flex items-center justify-center">
            <Edit3 size={17} className="text-text-muted" />
          </button>
        </div>

        {/* User card */}
        <div className="flex items-center gap-4">
          <div className="relative">
            <img src={currentUser.avatar} alt={currentUser.name} className="w-16 h-16 rounded-2xl object-cover" />
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center border-2 border-white">
              <Check size={10} className="text-white" strokeWidth={3} />
            </div>
          </div>
          <div>
            <h2 className="font-bold text-text-dark text-lg">{currentUser.name}</h2>
            <p className="text-text-muted text-xs">{currentUser.email}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <Award size={13} className={tier.color} />
              <span className={`text-xs font-semibold ${tier.color}`}>{tier.name} Member</span>
              <span className="text-text-muted text-xs">· Since {currentUser.memberSince}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Points card */}
      <div className="mx-4 mt-4 rounded-3xl overflow-hidden" style={{ background: 'linear-gradient(135deg, #0D1B2A 0%, #1a3a28 100%)' }}>
        <div className="p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[#64748B] text-xs font-medium">Spotly Points</p>
              <div className="flex items-end gap-2 mt-1">
                <span className="text-white text-4xl font-extrabold">{points.toLocaleString()}</span>
                <span className="text-accent text-sm font-medium mb-1">pts</span>
              </div>
            </div>
            <div className="w-14 h-14 bg-primary/20 rounded-2xl flex items-center justify-center">
              <Zap size={28} fill="#34D399" className="text-accent" />
            </div>
          </div>

          {/* Progress to next tier */}
          {nextTier && (
            <div className="mb-2">
              <div className="flex justify-between text-xs mb-1.5">
                <span className={`font-semibold ${tier.color}`}>{tier.name}</span>
                <span className="text-[#64748B]">{nextTier.min - points} pts to {nextTier.name}</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${progressToNext}%`, background: 'linear-gradient(90deg, #16A34A, #34D399)' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-white/10 px-5 py-3 flex items-center justify-between">
          <span className="text-[#64748B] text-xs">+{currentUser.points} lifetime points earned</span>
          <div className="flex items-center gap-1 text-accent text-xs font-semibold">
            <TrendingUp size={12} />
            <span>View history</span>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="px-4 mt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-text-dark text-base">Redeem Rewards</h2>
          <button className="text-primary text-xs font-semibold flex items-center gap-0.5">
            All rewards <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
          {REWARDS.map(reward => {
            const canRedeem = points >= reward.points && !redeemed.includes(reward.id)
            const isRedeemed = redeemed.includes(reward.id)
            return (
              <div key={reward.id} className={`shrink-0 w-40 bg-white rounded-2xl p-3 shadow-card border-2 transition-all ${
                canRedeem ? 'border-transparent' : 'border-transparent opacity-60'
              }`}>
                <div className="text-2xl mb-2">{reward.emoji}</div>
                <p className="text-text-dark font-semibold text-xs leading-tight mb-1">{reward.name}</p>
                <p className="text-primary font-bold text-xs mb-2">{reward.points.toLocaleString()} pts</p>
                <button
                  onClick={() => canRedeem && setRedeemId(reward.id)}
                  disabled={!canRedeem}
                  className={`w-full py-1.5 rounded-xl text-[11px] font-semibold transition-all ${
                    isRedeemed ? 'bg-pale-mint text-primary'
                    : canRedeem ? 'bg-primary text-white'
                    : 'bg-gray-100 text-text-muted cursor-not-allowed'
                  }`}
                >
                  {isRedeemed ? '✓ Redeemed' : canRedeem ? 'Redeem' : `Need ${reward.points - points} more`}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick stats */}
      <div className="px-4 mt-5">
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Bookings', value: '14', icon: '📅' },
            { label: 'Reviews', value: '6', icon: '⭐' },
            { label: 'Fav Places', value: '11', icon: '❤️' },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-2xl p-3 text-center shadow-card">
              <div className="text-xl mb-1">{stat.icon}</div>
              <p className="font-bold text-text-dark text-xl">{stat.value}</p>
              <p className="text-text-muted text-[11px]">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Settings */}
      <div className="px-4 mt-5">
        <h2 className="font-semibold text-text-dark text-base mb-3">Settings</h2>
        <div className="bg-white rounded-2xl overflow-hidden shadow-card">
          {SETTINGS.map(({ icon: Icon, label, sub }, i) => (
            <div key={label}>
              <button className="w-full flex items-center gap-3 px-4 py-4">
                <div className="w-9 h-9 bg-app-bg rounded-xl flex items-center justify-center shrink-0">
                  <Icon size={16} className="text-primary" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-medium text-text-dark text-sm">{label}</p>
                  <p className="text-text-muted text-xs">{sub}</p>
                </div>
                <ChevronRight size={16} className="text-text-muted" />
              </button>
              {i < SETTINGS.length - 1 && <div className="h-px bg-gray-50 ml-16" />}
            </div>
          ))}
        </div>
      </div>

      {/* Logout */}
      <div className="px-4 mt-4 pb-4">
        <button className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-500 font-semibold py-4 rounded-2xl text-sm">
          <LogOut size={16} />
          Sign Out
        </button>
      </div>

      {/* Redeem modal */}
      {redeemId && (
        <div className="absolute inset-0 z-50 flex items-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setRedeemId(null)} />
          <div className="relative w-full bg-white rounded-t-3xl p-5 slide-up">
            <div className="flex justify-center mb-3"><div className="w-10 h-1 bg-gray-300 rounded-full" /></div>
            {(() => {
              const r = REWARDS.find(rr => rr.id === redeemId)
              return (
                <>
                  <div className="text-center mb-5">
                    <div className="text-4xl mb-3">{r.emoji}</div>
                    <h3 className="font-bold text-text-dark text-lg">{r.name}</h3>
                    <p className="text-text-muted text-sm mt-1">This will use {r.points.toLocaleString()} of your {points.toLocaleString()} points</p>
                  </div>
                  <button onClick={() => { setRedeemed(prev => [...prev, redeemId]); setRedeemId(null) }}
                    className="w-full bg-primary text-white py-4 rounded-2xl font-semibold text-sm mb-3">
                    Redeem {r.points.toLocaleString()} Points
                  </button>
                  <button onClick={() => setRedeemId(null)} className="w-full bg-app-bg text-text-dark py-4 rounded-2xl font-semibold text-sm">
                    Cancel
                  </button>
                </>
              )
            })()}
          </div>
        </div>
      )}
    </div>
  )
}
