import { useState, type FormEvent } from 'react'
import { checkAnswer } from '../../engine/check-answer.ts'
import type { StationSystem } from '../../engine/game.ts'
import { POINTS } from '../../engine/score.ts'
import { displayClass, puzzleKindLabel } from '../labels.ts'
import PuzzlePieces, { type PieceView } from './PuzzlePieces.tsx'
import PuzzleVisualView from './PuzzleVisualView.tsx'

type Props = {
  system: StationSystem
  onSubmit: (answer: string) => void
  onHint: () => void
  onBack: () => void
  /** Crew only: who restored this system. */
  solverName?: string
  /** A split puzzle's pieces and who holds each. */
  pieces?: readonly PieceView[]
}

const HINT_COST = Math.abs(POINTS.perHint)

export default function SystemPanel({
  system,
  onSubmit,
  onHint,
  onBack,
  solverName,
  pieces,
}: Props) {
  const [answer, setAnswer] = useState('')
  const [wrong, setWrong] = useState(false)
  const [shaking, setShaking] = useState(false)

  const { puzzle } = system
  const solved = system.status === 'solved'
  const hintsShown = puzzle.hints.slice(0, system.hintsUsed)
  const hintsLeft = puzzle.hints.length - system.hintsUsed
  const titleId = `${system.id}-title`
  const inputId = `${system.id}-answer`

  /** Both ways of answering end up here: typing one in, or tapping something in the picture. */
  function answerWith(value: string) {
    if (value.trim() === '') return
    // The engine decides; checking here too only picks which feedback to show straight away.
    const correct = checkAnswer(puzzle, value)
    onSubmit(value)
    if (correct) {
      setAnswer('')
    } else {
      setWrong(true)
      setShaking(true)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    answerWith(answer)
  }

  return (
    <section
      aria-labelledby={titleId}
      className="flex flex-col gap-6 lg:self-start lg:rounded-2xl lg:border lg:border-line lg:bg-panel/80 lg:p-8 lg:backdrop-blur"
    >
      <button
        type="button"
        onClick={onBack}
        className="-my-2 min-h-11 self-start font-display text-xs text-ink-muted hover:text-ink lg:hidden"
      >
        ← All systems
      </button>

      <header>
        <p className="font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
          {puzzleKindLabel(puzzle.kind)}
        </p>
        <h2 id={titleId} className="mt-1 text-2xl font-bold text-balance">
          {system.name}
        </h2>
      </header>

      <p className="max-w-prose text-sm/6 text-ink-muted">{puzzle.prompt}</p>

      {pieces ? (
        <PuzzlePieces
          kind={puzzle.kind}
          pieces={pieces}
          onAnswer={solved ? undefined : answerWith}
        />
      ) : puzzle.visual ? (
        <PuzzleVisualView visual={puzzle.visual} onAnswer={solved ? undefined : answerWith} />
      ) : (
        puzzle.display && (
          <p
            className={`rounded-xl border border-line bg-void/60 px-5 py-6 text-center ${displayClass(puzzle.kind)}`}
          >
            {puzzle.display}
          </p>
        )
      )}

      {solved ? (
        <div role="status" className="rounded-xl border border-nominal/50 bg-nominal/10 p-5">
          <p className="font-display text-sm font-bold text-nominal">
            ✓ {system.name} restored{solverName ? ` by ${solverName}` : ''}
          </p>
          <p className="mt-2 text-sm text-ink-muted">
            Answer: <span className="font-display text-ink">{puzzle.answer}</span>
          </p>
          <p className="mt-3 text-sm text-ink-muted italic">
            HALCYON: “Thank you for your cooperation.”
          </p>
          <button
            type="button"
            onClick={onBack}
            className="mt-5 min-h-12 w-full rounded-xl bg-nominal text-sm font-bold text-void lg:hidden"
          >
            Back to all systems
          </button>
        </div>
      ) : (
        <form onSubmit={submit} className="flex flex-col gap-2">
          <label
            htmlFor={inputId}
            className="font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase"
          >
            Your answer
          </label>
          <div
            onAnimationEnd={() => setShaking(false)}
            className={`flex gap-2 ${shaking ? 'motion-safe:animate-shake' : ''}`}
          >
            {/* text-base (16px) stops iPhones zooming in when the field is focused. */}
            <input
              id={inputId}
              value={answer}
              onChange={(event) => {
                setAnswer(event.target.value)
                setWrong(false)
              }}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              enterKeyHint="go"
              aria-invalid={wrong}
              aria-describedby={`${inputId}-feedback`}
              className={`min-h-12 min-w-0 flex-1 rounded-xl border bg-void/60 px-4 font-display text-base tracking-wide ${
                wrong ? 'border-critical' : 'border-line'
              }`}
            />
            <button
              type="submit"
              className="min-h-12 shrink-0 rounded-xl bg-nominal px-5 text-sm font-bold text-void"
            >
              Submit
            </button>
          </div>
          <p
            id={`${inputId}-feedback`}
            aria-live="polite"
            className="min-h-5 font-display text-xs text-critical"
          >
            {wrong ? 'Access denied. Check your answer and try again.' : ''}
          </p>
        </form>
      )}

      {(hintsShown.length > 0 || !solved) && (
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
          {!solved && (
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
          )}
        </div>
      )}
    </section>
  )
}
