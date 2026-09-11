import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `intervalMs`. Pass null to stop ticking (e.g. game over).
 * `clock` lets multiplayer use Firestore's time instead of this device's, which may be off.
 */
export function useNow(intervalMs: number | null, clock: () => number = Date.now): number {
  const [now, setNow] = useState(clock)

  useEffect(() => {
    if (intervalMs === null) return
    const id = setInterval(() => setNow(clock()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs, clock])

  return now
}
