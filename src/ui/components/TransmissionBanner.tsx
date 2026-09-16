import { motion, useReducedMotion } from 'motion/react'
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

/** Long enough to read the first line and decide to open it; short enough not to sit in the way. */
const DISMISS_MS = 14_000

type Props = { beat: StoryBeat; transmission: Transmission; onClose: () => void }

/**
 * A transmission arriving mid-shift. It sits in the page's own flow and sticks to the top as you
 * scroll, so it can never cover the puzzle you're working on or swallow a tap meant for a button.
 * The full text is always in the transmission log afterwards.
 */
export default function TransmissionBanner({ beat, transmission, onClose }: Props) {
  const [open, setOpen] = useState(false)
  const tone = BEAT_TONES[beat]
  const still = useReducedMotion()

  // Clears itself, unless it has been opened to read in full.
  useEffect(() => {
    if (open) return
    const timer = setTimeout(onClose, DISMISS_MS)
    return () => clearTimeout(timer)
  }, [open, onClose])

  const lines = transmission.lines
  const shown = open ? lines : lines.slice(0, 1)

  return (
    <motion.aside
      aria-live="polite"
      initial={still ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className={`sticky top-2 z-20 mb-4 rounded-xl border bg-panel-raised/95 shadow-lg shadow-black/40 backdrop-blur lg:col-span-2 ${tone.border}`}
    >
      <div className="flex items-start gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          <p className={`font-display text-[10px] tracking-[0.16em] uppercase ${tone.text}`}>
            ◉ {BEAT_LABELS[beat]} · {transmission.from}
          </p>
          <div className="mt-1 flex flex-col gap-1 text-sm/6">
            {shown.map((line) => (
              <p key={line}>{line}</p>
            ))}
          </div>
          {lines.length > 1 && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              className="mt-1 min-h-9 font-display text-[11px] text-ink-muted underline-offset-4 hover:text-ink hover:underline"
            >
              {open ? 'Show less' : `Read the rest (${lines.length - 1} more)`}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss this transmission"
          className="-mr-1 -mt-1 min-h-11 min-w-11 shrink-0 font-display text-sm text-ink-muted hover:text-ink"
        >
          ✕
        </button>
      </div>
    </motion.aside>
  )
}
