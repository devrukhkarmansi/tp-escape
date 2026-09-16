import { useMemo, useState } from 'react'
import { sweepScope, type AnomalyTell } from '../../engine/puzzles/anomaly.ts'

type Props = {
  tell: AnomalyTell
  contacts: number
  code: string
  onAnswer?: (answer: string) => void
}

/** Three wrong taps and the scope sweeps again, with the anomaly somewhere new. */
const TAPS_PER_SWEEP = 3

/**
 * The scope: a field of contacts with one odd one out. Tapping the anomaly reads its sector code
 * back, which answers the puzzle; three wrong taps and the field is swept again from scratch.
 */
export default function AnomalyField({ tell, contacts, code, onAnswer }: Props) {
  const [sweep, setSweep] = useState(0)
  const [missed, setMissed] = useState(0)
  const { contacts: field, oddIndex } = useMemo(
    () => sweepScope(code, sweep, contacts),
    [code, sweep, contacts],
  )

  function tap(index: number) {
    if (!onAnswer) return
    if (index === oddIndex) return onAnswer(code)
    const misses = missed + 1
    if (misses < TAPS_PER_SWEEP) return setMissed(misses)
    // Out of taps: sweep again, so guessing costs time rather than being free.
    setMissed(0)
    setSweep((n) => n + 1)
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-line bg-void/60">
        {field.map((contact, index) => {
          const odd = index === oddIndex
          const size = odd && tell === 'size' ? 10 : 14
          const colour = odd && tell === 'colour' ? 'bg-caution' : 'bg-nominal'
          const pulses = !(odd && tell === 'still')
          // Screen readers get the same tells sighted players do: colour, size, whether it pulses.
          const described = [
            odd && tell === 'colour' ? 'amber' : 'teal',
            odd && tell === 'size' ? 'small' : 'normal size',
            pulses ? 'pulsing' : 'steady',
          ].join(', ')
          return (
            <button
              key={index}
              type="button"
              disabled={!onAnswer}
              onClick={() => tap(index)}
              aria-label={`Contact ${index + 1}: ${described}`}
              style={{
                left: `${contact.x}%`,
                top: `${contact.y}%`,
                animationDelay: `${contact.delay}s`,
              }}
              className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${
                pulses ? 'motion-safe:animate-contact' : ''
              }`}
            >
              <span
                className={`rounded-full ${colour} shadow-[0_0_12px_2px] shadow-current/40`}
                style={{ width: size, height: size }}
              />
            </button>
          )
        })}
      </div>

      <p aria-live="polite" className="font-display text-xs text-ink-muted">
        {missed === 0
          ? `Sweep ${sweep + 1} · ${TAPS_PER_SWEEP} taps`
          : `${TAPS_PER_SWEEP - missed} tap${TAPS_PER_SWEEP - missed === 1 ? '' : 's'} left on this sweep`}
      </p>
    </div>
  )
}
