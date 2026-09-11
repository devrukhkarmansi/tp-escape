/** 1,024,000 ms → "17:04". Rounds up, so the clock only shows 00:00 when time is truly up. */
export function formatClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Score rows: +340, −40 (a real minus sign), 0. */
export function formatPoints(points: number): string {
  if (points > 0) return `+${points}`
  if (points < 0) return `−${Math.abs(points)}`
  return '0'
}

/** For screen readers: "17 minutes 4 seconds". */
export function describeClock(ms: number): string {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  const parts = []
  if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`)
  if (seconds > 0 || minutes === 0) parts.push(`${seconds} ${seconds === 1 ? 'second' : 'seconds'}`)
  return parts.join(' ')
}
