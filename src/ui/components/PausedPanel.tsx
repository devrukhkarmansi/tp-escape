import { formatClock } from '../format.ts'

type Props = { timeLeft: number; onResume: () => void; onAbandon: () => void }

/** Replaces the board while paused, so a pause can't be used as free thinking time. */
export default function PausedPanel({ timeLeft, onResume, onAbandon }: Props) {
  return (
    <main className="mx-auto flex min-h-[70dvh] w-full max-w-md flex-col items-center justify-center gap-4 px-5 text-center">
      <p className="font-display text-[11px] tracking-[0.18em] text-ink-muted uppercase">
        Mission paused
      </p>
      <p className="font-display text-6xl font-bold tabular-nums">{formatClock(timeLeft)}</p>
      <p className="max-w-xs text-sm/6 text-balance text-ink-muted">
        HALCYON is holding the countdown. The puzzles stay hidden until you resume.
      </p>
      <button
        type="button"
        onClick={onResume}
        className="mt-4 min-h-12 w-full rounded-xl bg-nominal text-sm font-bold text-void hover:brightness-110"
      >
        Resume
      </button>
      <button
        type="button"
        onClick={onAbandon}
        className="min-h-11 font-display text-xs text-ink-muted underline-offset-4 hover:text-critical hover:underline"
      >
        Abandon mission
      </button>
    </main>
  )
}
