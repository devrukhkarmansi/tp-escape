import { awardsFor } from '../../engine/awards.ts'
import { isFinale, timeLeftMs, type GameState } from '../../engine/game.ts'
import { POINTS, scoreGame } from '../../engine/score.ts'
import { endingFor } from '../../engine/story.ts'
import Backdrop from '../components/Backdrop.tsx'
import { formatClock, formatPoints } from '../format.ts'
import { puzzleKindLabel } from '../labels.ts'
import { THEME } from '../solo-game.ts'

type Props = {
  game: GameState
  onPlayAgain: () => void
  onHome: () => void
  /** Solo: always. Crew: only the host starts the next round. */
  canPlayAgain: boolean
  /** Crew only: shown to everyone who's waiting on the host. */
  hostName?: string
  /** Crew only: turns a player id into a name, for "restored by". */
  solverName?: (playerId: string | undefined) => string
  /** Crew only: how many players were in the crew, so crew awards can be handed out. */
  crewSize?: number
  homeLabel: string
}

export default function DebriefScreen({
  game,
  onPlayAgain,
  onHome,
  canPlayAgain,
  hostName,
  solverName,
  crewSize = 1,
  homeLabel,
}: Props) {
  const won = game.status === 'won'
  const score = scoreGame(game)
  const puzzleSystems = game.systems.filter((s) => !isFinale(s))
  const restored = puzzleSystems.filter((s) => s.status === 'solved').length
  const solved = game.systems.filter((s) => s.status === 'solved').length
  const hintsUsed = game.systems.reduce((sum, s) => sum + s.hintsUsed, 0)
  const wrongAccusations = game.systems.find(isFinale)?.wrongAttempts ?? 0
  const timeLeft = timeLeftMs(game, game.endedAt ?? game.endsAt)

  const { suspects } = THEME.mystery
  const culprit = suspects.find((s) => s.id === game.mystery.culpritId)

  const awards = awardsFor(game, crewSize)

  const rows = [
    { label: `Systems restored (${solved} × ${POINTS.perSystem})`, points: score.systems },
    { label: 'Time bonus', points: score.time },
    { label: `Hints used (${hintsUsed})`, points: score.hints },
    ...(wrongAccusations > 0
      ? [{ label: `Wrong accusations (${wrongAccusations})`, points: score.accusations }]
      : []),
  ]

  return (
    <div data-alert={won ? 'nominal' : 'critical'} className="relative isolate min-h-dvh">
      <Backdrop />
      <main className="mx-auto grid w-full max-w-5xl gap-12 px-5 pt-14 pb-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-16 lg:px-10 lg:pt-20">
        <section className="flex flex-col">
          <p className="font-display text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            Debrief · {THEME.name}
          </p>
          <h1
            className={`mt-4 font-display text-4xl font-bold tracking-wide text-balance lg:text-5xl/tight ${won ? 'text-nominal' : 'text-critical'}`}
          >
            {won ? 'STATION SECURED' : 'MODULE PURGED'}
          </h1>
          <p className="mt-4 text-base/7 text-balance text-ink-muted">
            {won
              ? `Escape pod launched with ${formatClock(timeLeft)} to spare.`
              : `${restored} of ${puzzleSystems.length} systems restored before the purge.`}
          </p>
          <p className="mt-3 font-display text-sm/6 text-balance text-ink-muted italic">
            HALCYON: “{endingFor(game, THEME)}”
          </p>

          {/* Every ending reveals the truth, win or lose (docs/story-space-station.md). */}
          {culprit && (
            <div className="mt-8 rounded-xl border border-caution/50 bg-caution/5 p-5">
              <p className="font-display text-[11px] tracking-[0.18em] text-caution uppercase">
                The truth
              </p>
              <p className="mt-3 text-base/7 text-balance">
                <span className="font-bold">{culprit.name}</span> ({culprit.role.toLowerCase()})
                signed the purge order. They took {game.mystery.item}, hidden {game.mystery.place}.
              </p>
              <p className="mt-2 text-sm text-ink-muted">
                {won
                  ? 'Your crew named them and launched the pod.'
                  : 'The purge came before anyone could name them.'}
              </p>
            </div>
          )}

          <dl className="mt-8 overflow-hidden rounded-xl border border-line bg-panel/80 font-display text-sm">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex justify-between gap-4 border-b border-line px-4 py-3"
              >
                <dt className="text-ink-muted">{row.label}</dt>
                <dd className="tabular-nums">{formatPoints(row.points)}</dd>
              </div>
            ))}
            <div className="flex justify-between gap-4 bg-panel-raised px-4 py-4 font-bold text-nominal">
              <dt>ESCAPE SCORE</dt>
              <dd className="text-lg tabular-nums">{score.total}</dd>
            </div>
          </dl>

          {awards.length > 0 && (
            <section aria-labelledby="awards" className="mt-8">
              <h2
                id="awards"
                className="mb-3 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase"
              >
                Commendations
              </h2>
              <ul className="grid gap-2 sm:grid-cols-2">
                {awards.map((award) => (
                  <li
                    key={award.id}
                    className="rounded-xl border border-nominal/30 bg-nominal/5 px-4 py-3"
                  >
                    <p className="font-display text-sm font-bold text-nominal">
                      ★ {award.title}
                      {award.playerId && solverName && (
                        <span className="text-ink"> · {solverName(award.playerId)}</span>
                      )}
                    </p>
                    <p className="mt-1 text-sm/6 text-ink-muted">{award.description}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            {canPlayAgain ? (
              <button
                type="button"
                onClick={onPlayAgain}
                className="min-h-12 rounded-xl bg-nominal px-6 text-sm font-bold text-void sm:flex-1"
              >
                {solverName ? 'Another round, same crew' : 'Play again'}
              </button>
            ) : (
              <p className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-line px-6 text-center font-display text-xs text-ink-muted sm:flex-1">
                Waiting for {hostName ?? 'the host'} to start another round…
              </p>
            )}
            <button
              type="button"
              onClick={onHome}
              className="min-h-12 rounded-xl border border-line px-6 text-sm font-bold hover:border-ink-muted/60 sm:flex-1"
            >
              {homeLabel}
            </button>
          </div>
        </section>

        <section aria-labelledby="system-report">
          <h2
            id="system-report"
            className="font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase"
          >
            System report
          </h2>
          <ul className="mt-3 flex flex-col gap-2">
            {game.systems.map((system) => {
              const restored = system.status === 'solved'
              return (
                <li
                  key={system.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-line bg-panel/60 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{system.name}</p>
                    <p className="font-display text-[11px] text-ink-muted">
                      {puzzleKindLabel(system.puzzle.kind)} · answer{' '}
                      <span className="text-ink">{system.puzzle.answer}</span>
                      {restored && solverName && (
                        <>
                          {' '}
                          · by <span className="text-ink">{solverName(system.solvedBy)}</span>
                        </>
                      )}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-md px-2 py-1 font-display text-[10px] tracking-[0.08em] uppercase ${
                      restored ? 'bg-nominal/15 text-nominal' : 'bg-critical/15 text-critical'
                    }`}
                  >
                    {restored ? '✓ Restored' : '✗ Offline'}
                  </span>
                </li>
              )
            })}
          </ul>
        </section>
      </main>
    </div>
  )
}
