import { useEffect, useState } from 'react'

/** The current time, refreshed every `intervalMs`. Pass null to stop ticking (e.g. game over). */
export function useNow(intervalMs: number | null): number {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (intervalMs === null) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}
