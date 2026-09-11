import { useState } from 'react'
import { DIFFICULTIES, type DifficultyId } from '../../engine/difficulty.ts'

const BRIEFING = [
  '1–6 crew, on any phone or laptop',
  'New puzzles every run',
  'No accounts, just a crew code',
]

export default function HomeScreen() {
  const [shift, setShift] = useState<DifficultyId>('full')

  return (
    <div className="relative isolate min-h-dvh overflow-hidden">
      <div aria-hidden className="absolute inset-0 -z-10 bg-console-glow" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-console-grid opacity-60" />

      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-10 px-5 pt-16 pb-10 lg:grid lg:max-w-5xl lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20 lg:px-10 lg:py-16">
        <header className="text-center lg:text-left">
          <p className="font-display text-[11px] tracking-[0.18em] text-ink-muted uppercase lg:text-xs">
            Kepler-9 relay · distress channel
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-wide text-balance lg:mt-6 lg:text-6xl lg:leading-[1.05]">
            MAYDAY PROTOCOL
          </h1>
          <p className="mt-3 text-sm/6 text-balance text-ink-muted lg:mt-6 lg:max-w-md lg:text-lg/8">
            A co-op escape room for 1–6 players. Get your crew off the station before the module
            purges.
          </p>
          <ul className="mt-10 hidden flex-col gap-3 lg:flex">
            {BRIEFING.map((line) => (
              <li
                key={line}
                className="flex items-center gap-3 font-display text-xs tracking-wide text-ink-muted"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-nominal" />
                {line}
              </li>
            ))}
          </ul>
        </header>

        <section
          aria-label="Start a game"
          className="flex flex-1 flex-col gap-10 lg:flex-none lg:gap-8 lg:rounded-2xl lg:border lg:border-line lg:bg-panel/80 lg:p-8 lg:shadow-2xl lg:shadow-black/40 lg:backdrop-blur"
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
              Shift length
            </legend>
            {DIFFICULTIES.map((tier) => (
              <label
                key={tier.id}
                className="flex min-h-14 cursor-pointer items-center justify-between rounded-xl border border-line px-4 transition-colors hover:border-ink-muted/60 has-checked:border-nominal has-checked:bg-nominal/5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-nominal"
              >
                <input
                  type="radio"
                  name="shift"
                  value={tier.id}
                  checked={shift === tier.id}
                  onChange={() => setShift(tier.id)}
                  className="sr-only"
                />
                <span>
                  <span className="block text-sm font-bold">{tier.name}</span>
                  <span className="font-display text-[11px] text-ink-muted">
                    {tier.systems} systems
                  </span>
                </span>
                <span className="font-display text-xs text-ink-muted tabular-nums">
                  ~{tier.minutes} min
                </span>
              </label>
            ))}
          </fieldset>

          <div className="mt-auto flex flex-col gap-3 lg:mt-0">
            <button
              type="button"
              disabled
              className="min-h-12 rounded-xl bg-nominal text-sm font-bold text-void disabled:cursor-not-allowed disabled:opacity-40"
            >
              Host a crew
            </button>
            <button
              type="button"
              disabled
              className="min-h-12 rounded-xl border border-line text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"
            >
              Join with code
            </button>
            <p className="text-center font-display text-[11px] text-ink-muted">
              Crew systems come online in the next update.
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
