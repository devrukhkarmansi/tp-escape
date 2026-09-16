import { useCallback, useEffect, useRef, useState } from 'react'
import { soundEnabled } from '../hooks/use-sound-setting.ts'
import { playPad } from '../sound.ts'

type Props = {
  pattern: readonly number[]
  pads: number
  /** How long one flash lasts. The gap between flashes is a third of it. */
  unitMs: number
  /** Called with the pads you tapped, once you have tapped as many as the pattern is long. */
  onAnswer?: (answer: string) => void
}

const PAD_STYLES = [
  { off: 'bg-sky-500/15 text-sky-200', on: 'bg-sky-400 text-void' },
  { off: 'bg-violet-500/15 text-violet-200', on: 'bg-violet-400 text-void' },
  { off: 'bg-pink-500/15 text-pink-200', on: 'bg-pink-400 text-void' },
  { off: 'bg-lime-500/15 text-lime-200', on: 'bg-lime-400 text-void' },
  { off: 'bg-orange-400/15 text-orange-200', on: 'bg-orange-300 text-void' },
]

/**
 * The nav array: a pattern of pads flashes and beeps, then you play it back. Tapping as many pads
 * as the pattern is long submits what you tapped, so a wrong guess is judged as a whole attempt.
 */
export default function MemoryPads({ pattern, pads, unitMs, onAnswer }: Props) {
  const [lit, setLit] = useState<number | null>(null)
  // Starts true: the pattern plays itself as soon as the puzzle opens, and taps wait for it.
  const [playing, setPlaying] = useState(true)
  const [tapped, setTapped] = useState<number[]>([])
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const stop = useCallback(() => {
    for (const timer of timers.current) clearTimeout(timer)
    timers.current = []
  }, [])

  const play = useCallback(() => {
    stop()
    setTapped([])
    setPlaying(true)
    const gap = Math.round(unitMs / 3)
    pattern.forEach((pad, index) => {
      const at = index * (unitMs + gap)
      timers.current.push(
        setTimeout(() => {
          setLit(pad)
          if (soundEnabled()) playPad(pad, unitMs)
        }, at),
        setTimeout(() => setLit(null), at + unitMs),
      )
    })
    timers.current.push(setTimeout(() => setPlaying(false), pattern.length * (unitMs + gap)))
  }, [pattern, unitMs, stop])

  // Play once when the puzzle opens, after a beat so the first flash isn't missed. Leaving
  // mid-pattern clears the timers.
  useEffect(() => {
    const start = setTimeout(play, 500)
    return () => {
      clearTimeout(start)
      stop()
    }
  }, [play, stop])

  function tap(pad: number) {
    if (playing || !onAnswer) return
    if (soundEnabled()) playPad(pad)
    const next = [...tapped, pad]
    setTapped(next)
    if (next.length < pattern.length) return
    onAnswer(next.map((index) => index + 1).join(''))
    setTapped([])
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        // One row of pads, so the array and the replay button fit a phone screen together.
        className={`mx-auto grid w-full max-w-sm gap-2 rounded-xl border border-line bg-void/60 p-3 sm:max-w-md sm:gap-3 sm:p-4 ${
          pads > 4 ? 'grid-cols-5' : 'grid-cols-4'
        }`}
      >
        {Array.from({ length: pads }, (_, index) => {
          const style = PAD_STYLES[index % PAD_STYLES.length]!
          const isLit = lit === index
          return (
            <button
              key={index}
              type="button"
              disabled={playing || !onAnswer}
              onClick={() => tap(index)}
              aria-label={`Pad ${index + 1}`}
              className={`flex aspect-square items-center justify-center rounded-xl font-display text-xl font-bold transition-[background-color,box-shadow] duration-75 disabled:opacity-60 ${
                isLit ? `${style.on} shadow-[0_0_30px_6px] shadow-current/40` : style.off
              }`}
            >
              {index + 1}
            </button>
          )
        })}
      </div>

      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={play}
          disabled={playing}
          className="min-h-11 rounded-lg border border-line px-4 font-display text-xs hover:border-ink-muted/60 disabled:opacity-50"
        >
          ▶ Replay the pattern
        </button>
        <p aria-live="polite" className="font-display text-xs text-ink-muted">
          {playing ? 'Watch…' : `${tapped.length} of ${pattern.length} tapped`}
        </p>
      </div>
    </div>
  )
}
