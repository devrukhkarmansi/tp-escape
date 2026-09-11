import { useEffect, useState } from 'react'
import type { StoryBeat } from '../../engine/story.ts'
import type { Transmission } from '../../engine/theme.ts'
import { BEAT_LABELS } from '../labels.ts'

const BEAT_TONES: Record<StoryBeat, { border: string; text: string }> = {
  opening: { border: 'border-nominal/50', text: 'text-nominal' },
  newInfo: { border: 'border-nominal/50', text: 'text-nominal' },
  twist: { border: 'border-caution/60', text: 'text-caution' },
  emergency: { border: 'border-critical/70', text: 'text-critical' },
}

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Props = { beat: StoryBeat; transmission: Transmission; onClose: () => void }

/** A full-screen message from HALCYON that types itself out. */
export default function TransmissionOverlay({ beat, transmission, onClose }: Props) {
  const text = transmission.lines.join('\n')
  const [typed, setTyped] = useState(() => (prefersReducedMotion() ? text.length : 0))
  const tone = BEAT_TONES[beat]
  const titleId = `transmission-${beat}`

  useEffect(() => {
    if (typed >= text.length) return
    const id = setTimeout(() => setTyped((count) => Math.min(text.length, count + 2)), 18)
    return () => clearTimeout(id)
  }, [typed, text.length])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      className="fixed inset-0 z-40 flex items-center justify-center bg-void/85 px-5 backdrop-blur-sm"
    >
      <div
        className={`w-full max-w-lg rounded-2xl border bg-panel p-6 shadow-2xl shadow-black/60 sm:p-8 ${tone.border}`}
      >
        <p
          id={titleId}
          className={`font-display text-[11px] tracking-[0.18em] uppercase ${tone.text}`}
        >
          ◉ {BEAT_LABELS[beat]}
        </p>
        <p className="mt-2 font-display text-xs text-ink-muted">{transmission.from}</p>

        {/* The typing is for show; screen readers get the whole message at once. */}
        <p className="sr-only">{transmission.lines.join(' ')}</p>
        <p
          aria-hidden
          className="mt-5 min-h-28 font-display text-sm/7 whitespace-pre-line text-ink sm:text-base/8"
        >
          {text.slice(0, typed)}
          {typed < text.length && <span className="animate-pulse">▍</span>}
        </p>

        <button
          type="button"
          autoFocus
          onClick={onClose}
          className="mt-6 min-h-12 w-full rounded-xl bg-nominal text-sm font-bold text-void hover:brightness-110"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
