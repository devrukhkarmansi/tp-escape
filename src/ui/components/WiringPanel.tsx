import { useState } from 'react'

/** Tailwind classes per wire colour. Every wire also shows its colour as a word. */
const WIRE_STYLES: Record<string, string> = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  yellow: 'bg-yellow-400',
  white: 'bg-zinc-100',
  green: 'bg-emerald-500',
  purple: 'bg-purple-500',
}

type Props = {
  wires: readonly string[]
  /** Cutting a wire answers the puzzle. Absent once the system is restored. */
  onCut?: (wireNumber: number) => void
}

/**
 * The panel: one row per wire. A cut takes two taps, because cutting the wrong wire ends the
 * shift: the first tap arms that wire, the second cuts it. Typing the wire's number still works.
 */
export default function WiringPanel({ wires, onCut }: Props) {
  const [armed, setArmed] = useState<number | null>(null)

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-line bg-void/60 px-4 py-4">
      {onCut && (
        <p className="font-display text-[11px] tracking-[0.1em] text-critical uppercase">
          ■ Live panel ·{' '}
          {armed ? 'Tap the same wire again to cut it' : 'A wrong cut ends the shift'}
        </p>
      )}
      <ul className="flex flex-col gap-2">
        {wires.map((color, index) => {
          const number = index + 1
          const label = `Wire ${number}, ${color}`
          const stripe = WIRE_STYLES[color] ?? 'bg-ink-muted'
          const isArmed = armed === number
          return (
            <li key={index}>
              <button
                type="button"
                disabled={!onCut}
                onClick={() => (isArmed ? onCut?.(number) : setArmed(number))}
                aria-label={
                  onCut ? (isArmed ? `Confirm cut of ${label}` : `Select ${label}`) : label
                }
                className={`flex min-h-12 w-full items-center gap-3 rounded-lg border px-3 enabled:hover:border-ink-muted/60 disabled:opacity-70 ${
                  isArmed ? 'border-critical bg-critical/10' : 'border-line'
                }`}
              >
                <span className="w-6 shrink-0 text-left font-display text-sm font-bold">
                  {index + 1}
                </span>
                <span aria-hidden className={`h-2 flex-1 rounded-full ${stripe}`} />
                <span className="w-16 shrink-0 text-right font-display text-[11px] text-ink-muted uppercase">
                  {color}
                </span>
                {onCut && (
                  <span
                    className={`shrink-0 font-display text-[11px] ${isArmed ? 'text-critical' : 'text-ink-muted'}`}
                  >
                    {isArmed ? '✂ Cut?' : '✂'}
                  </span>
                )}
              </button>
            </li>
          )
        })}
      </ul>
      {armed !== null && (
        <button
          type="button"
          onClick={() => setArmed(null)}
          className="min-h-11 self-start font-display text-xs text-ink-muted underline-offset-4 hover:text-ink hover:underline"
        >
          Put the cutters down
        </button>
      )}
    </div>
  )
}

/** The repair manual: rules read from the top, first match wins. */
export function RepairManual({ rules }: { rules: readonly string[] }) {
  return (
    <div className="rounded-xl border border-line bg-void/60 px-4 py-4">
      <p className="mb-2 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
        Repair manual · follow the first rule that fits
      </p>
      <ol className="flex flex-col gap-2">
        {rules.map((rule, index) => (
          <li key={rule} className="flex gap-3 text-sm/6">
            <span className="font-display text-xs text-ink-muted">{index + 1}.</span>
            <span>{rule}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}
