import { useState, type FormEvent } from 'react'
import { checkAnswer } from '../../engine/check-answer.ts'
import type { StationSystem } from '../../engine/game.ts'
import type { Mystery } from '../../engine/mystery.ts'
import { POINTS } from '../../engine/score.ts'
import type { Suspect } from '../../engine/theme.ts'

type Props = {
  system: StationSystem
  mystery: Mystery
  suspects: readonly Suspect[]
  /** The systems whose answers make up the launch code, so players can jump to them. */
  codeSystems: readonly { id: string; name: string; restored: boolean }[]
  onOpenSystem: (systemId: string) => void
  onAccuse: (suspectId: string, code: string) => void
  onHint: () => void
  onBack: () => void
}

const HINT_COST = Math.abs(POINTS.perHint)
const ACCUSATION_COST = Math.abs(POINTS.perWrongAccusation)
const label = 'font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase'

/** The finale: name the traitor from the evidence, and enter the launch code. */
export default function FinalePanel({
  system,
  mystery,
  suspects,
  codeSystems,
  onOpenSystem,
  onAccuse,
  onHint,
  onBack,
}: Props) {
  const [suspectId, setSuspectId] = useState<string | null>(null)
  const [code, setCode] = useState('')
  const [refused, setRefused] = useState(false)
  const [shaking, setShaking] = useState(false)

  const { puzzle } = system
  const codeLength = puzzle.answer.length
  const hintsShown = puzzle.hints.slice(0, system.hintsUsed)
  const hintsLeft = puzzle.hints.length - system.hintsUsed
  const ready = suspectId !== null && code.trim().length === codeLength

  function launch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!ready || suspectId === null) return
    // The engine decides; checking here too only picks which feedback to show straight away.
    const correct = suspectId === mystery.culpritId && checkAnswer(puzzle, code)
    onAccuse(suspectId, code)
    if (!correct) {
      setRefused(true)
      setShaking(true)
    }
  }

  return (
    <section
      aria-labelledby="finale-title"
      className="flex flex-col gap-6 lg:self-start lg:rounded-2xl lg:border lg:border-caution/50 lg:bg-panel/80 lg:p-8 lg:backdrop-blur"
    >
      <button
        type="button"
        onClick={onBack}
        className="-my-2 min-h-11 self-start font-display text-xs text-ink-muted hover:text-ink lg:hidden"
      >
        ← All systems
      </button>

      <header>
        <p className="font-display text-[11px] tracking-[0.14em] text-caution uppercase">
          Launch sequence
        </p>
        <h2 id="finale-title" className="mt-1 text-2xl font-bold">
          {system.name}
        </h2>
        <p className="mt-3 max-w-prose text-sm/6 text-ink-muted">
          HALCYON will only launch for crew who name whoever signed the purge order.
        </p>
      </header>

      <form onSubmit={launch} className="flex flex-col gap-6">
        <fieldset className="flex flex-col gap-2">
          <legend className={`mb-2 ${label}`}>Who signed the purge order?</legend>
          {mystery.suspectIds.map((id) => {
            const suspect = suspects.find((s) => s.id === id)
            if (!suspect) return null
            return (
              <label
                key={id}
                className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-line px-4 has-checked:border-caution has-checked:bg-caution/5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-caution"
              >
                <input
                  type="radio"
                  name="suspect"
                  value={id}
                  checked={suspectId === id}
                  onChange={() => {
                    setSuspectId(id)
                    setRefused(false)
                  }}
                  className="sr-only"
                />
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{suspect.name}</span>
                  <span className="font-display text-[11px] text-ink-muted">{suspect.role}</span>
                </span>
              </label>
            )
          })}
        </fieldset>

        <div className="flex flex-col gap-2">
          <span className={label}>Launch code</span>
          <p className="text-sm/6 text-ink-muted">
            The first character of each answer from these systems, in this order:
          </p>
          <div className="flex flex-wrap gap-2">
            {codeSystems.map((s, i) => (
              <button
                key={s.id}
                type="button"
                onClick={() => onOpenSystem(s.id)}
                className="min-h-10 rounded-lg border border-line px-3 font-display text-xs hover:border-ink-muted/60"
              >
                {i + 1}. {s.name}
                {s.restored ? '' : ' (not restored)'}
              </button>
            ))}
          </div>
          <div
            onAnimationEnd={() => setShaking(false)}
            className={`mt-2 flex gap-2 ${shaking ? 'motion-safe:animate-shake' : ''}`}
          >
            <input
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase())
                setRefused(false)
              }}
              maxLength={codeLength}
              aria-label="Launch code"
              aria-invalid={refused}
              aria-describedby="launch-feedback"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
              placeholder={'•'.repeat(codeLength)}
              className={`min-h-12 min-w-0 flex-1 rounded-xl border bg-void/60 px-4 text-center font-display text-2xl tracking-[0.4em] uppercase ${
                refused ? 'border-critical' : 'border-line'
              }`}
            />
            <button
              type="submit"
              disabled={!ready}
              className="min-h-12 shrink-0 rounded-xl bg-caution px-5 text-sm font-bold text-void hover:brightness-110 disabled:opacity-40"
            >
              Launch
            </button>
          </div>
          <p
            id="launch-feedback"
            aria-live="polite"
            className="min-h-5 font-display text-xs text-critical"
          >
            {refused
              ? `Launch refused. HALCYON: “Credentials or code incorrect.” (−${ACCUSATION_COST} points)`
              : ''}
          </p>
        </div>
      </form>

      <div className="flex flex-col gap-3 border-t border-line pt-5">
        {hintsShown.length > 0 && (
          <ol className="flex flex-col gap-2">
            {hintsShown.map((hint, index) => (
              <li
                key={hint}
                className="rounded-lg border border-caution/30 bg-caution/5 px-4 py-3 text-sm/6"
              >
                <span className="font-display text-[10px] tracking-[0.12em] text-caution">
                  HINT {index + 1}
                </span>
                <span className="block">{hint}</span>
              </li>
            ))}
          </ol>
        )}
        <button
          type="button"
          onClick={onHint}
          disabled={hintsLeft === 0}
          className="min-h-11 self-start rounded-lg border border-caution/40 px-4 font-display text-xs text-caution enabled:hover:bg-caution/10 disabled:border-line disabled:text-ink-muted"
        >
          {hintsLeft === 0
            ? 'No hints left'
            : `Get a hint · −${HINT_COST} points · ${hintsLeft} left`}
        </button>
      </div>
    </section>
  )
}
