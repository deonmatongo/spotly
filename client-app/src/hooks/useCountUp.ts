import { useEffect, useRef, useState } from 'react'

// Rides requestAnimationFrame directly — this fires only a handful of times
// per screen visit, so it doesn't need the UI-thread machinery Reanimated
// brings for gesture work.
export default function useCountUp(target: number, duration = 900) {
  const [value, setValue] = useState(0)
  const frame = useRef<number | undefined>(undefined)

  useEffect(() => {
    const start = Date.now()
    const from = 0
    const tick = () => {
      const elapsed = Date.now() - start
      const t = Math.min(1, elapsed / duration)
      const eased = 1 - Math.pow(1 - t, 3)
      setValue(from + (target - from) * eased)
      if (t < 1) frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
    return () => { if (frame.current) cancelAnimationFrame(frame.current) }
  }, [target, duration])

  return value
}
