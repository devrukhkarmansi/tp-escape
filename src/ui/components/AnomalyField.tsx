import { useMemo, useState } from 'react'
import { scopeLayout, type FaultSignature, type ScopeRound } from '../../engine/puzzles/anomaly.ts'

type Props = {
  scope: readonly ScopeRound[]
  /** Only when you hold the report too: solo play, or nobody else on the crew has it. */
  signature?: FaultSignature
  onAnswer?: (answer: string) => void
}

/**
 * The scope, round by round. Several contacts look odd in one way; only one matches both halves of
 * the fault report. Tapping it reads back a digit, and the digits together are the sector code.
 */
export default function AnomalyField({ scope, signature, onAnswer }: Props) {
  const [found, setFound] = useState<number[]>([])
  const [missed, setMissed] = useState(0)
  const round = scope[found.length] ?? scope.at(-1)!
  const roundNumber = Math.min(found.length, scope.length - 1)
  const layout = useMemo(
    () => scopeLayout(String(round.digit), roundNumber, round.contacts.length),
    [round, roundNumber],
  )

  function tap(index: number) {
    if (!onAnswer) return
    if (index !== round.faultIndex) {
      // One tap, one miss: the updater form, so a flurry of taps all count.
      setMissed((misses) => misses + 1)
      return
    }
    const digits = [...found, round.digit]
    setFound(digits)
    setMissed(0)
    if (digits.length === scope.length) onAnswer(digits.join(''))
  }

  return (
    <div className="flex flex-col gap-3">
      {signature && (
        <p className="rounded-lg border border-caution/40 bg-caution/5 px-4 py-3 text-sm/6">
          <span className="block font-display text-[10px] tracking-[0.12em] text-caution uppercase">
            ▲ Fault report
          </span>
          Fault signature: <span className="font-bold">{signature.reads}</span>. Contacts matching
          only one of those are debris.
        </p>
      )}

      <div className="relative aspect-4/3 w-full overflow-hidden rounded-xl border border-line bg-void/60">
        {round.contacts.map((contact, index) => {
          const spot = layout[index]!
          const steady = contact.pulse === 'steady'
          return (
            <button
              key={index}
              type="button"
              disabled={!onAnswer}
              onClick={() => tap(index)}
              aria-label={`Contact ${index + 1}: ${contact.colour}, ${contact.size}, ${contact.pulse}`}
              style={{ left: `${spot.x}%`, top: `${spot.y}%`, animationDelay: `${spot.delay}s` }}
              className={`absolute flex size-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full ${
                steady ? '' : 'motion-safe:animate-contact'
              }`}
            >
              <span
                className={`rounded-full shadow-[0_0_12px_2px] shadow-current/40 ${
                  contact.colour === 'amber' ? 'bg-caution' : 'bg-nominal'
                }`}
                style={{
                  width: contact.size === 'small' ? 9 : 15,
                  height: contact.size === 'small' ? 9 : 15,
                }}
              />
            </button>
          )
        })}
      </div>

      <p aria-live="polite" className="font-display text-xs text-ink-muted">
        Sweep {Math.min(found.length + 1, scope.length)} of {scope.length}
        {found.length > 0 && ` · code so far ${found.join('')}`}
        {missed > 0 && ` · ${missed} wrong ${missed === 1 ? 'tap' : 'taps'} this sweep`}
      </p>
    </div>
  )
}
