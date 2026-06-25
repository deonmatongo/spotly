import { useEffect } from 'react'
import { MapPin } from 'lucide-react'

export default function SplashScreen({ onComplete }) {
  useEffect(() => {
    const t = setTimeout(onComplete, 2400)
    return () => clearTimeout(t)
  }, [onComplete])

  return (
    <div
      className="absolute inset-0 flex flex-col items-center justify-center"
      style={{ background: 'linear-gradient(160deg, #0D1B2A 0%, #0D2A1B 50%, #0D1B2A 100%)' }}
    >
      {/* Background glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-20"
        style={{ background: 'radial-gradient(circle, #34D399 0%, transparent 70%)' }}
      />

      {/* Wave decoration */}
      <svg className="absolute bottom-0 left-0 right-0 w-full opacity-10" viewBox="0 0 390 120" preserveAspectRatio="none">
        <path d="M0,60 C97,120 293,0 390,60 L390,120 L0,120 Z" fill="#34D399" />
        <path d="M0,80 C120,20 270,120 390,80 L390,120 L0,120 Z" fill="#16A34A" />
      </svg>

      {/* Logo */}
      <div className="relative z-10 flex flex-col items-center gap-6 fade-in">
        {/* Icon */}
        <div className="relative">
          <div className="w-20 h-20 bg-primary rounded-[24px] flex items-center justify-center shadow-2xl" style={{ boxShadow: '0 0 40px rgba(22,163,74,0.5)' }}>
            <MapPin size={38} fill="white" strokeWidth={1.5} className="text-white translate-y-1" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent rounded-full" />
        </div>

        {/* Wordmark */}
        <div className="text-center">
          <h1 className="text-5xl font-extrabold tracking-tight" style={{ color: '#FFFFFF', letterSpacing: '-0.5px' }}>
            spotly
          </h1>
          <p className="text-accent text-sm font-medium mt-1 tracking-wide">
            Everything you love, all in one spot.
          </p>
        </div>

        {/* Loading dots */}
        <div className="flex gap-2 mt-4">
          {[0, 0.2, 0.4].map((delay, i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-accent"
              style={{ animation: `pulse-green 1.2s ease-in-out ${delay}s infinite` }}
            />
          ))}
        </div>
      </div>

      {/* Bottom tagline */}
      <p className="absolute bottom-12 text-[#64748B] text-xs tracking-widest uppercase z-10">
        Discover more. Live better.
      </p>
    </div>
  )
}
