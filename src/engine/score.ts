import { isFinale, timeLeftMs, type GameState } from './game.ts'

export const POINTS = {
  /** Every restored system, and launching the Escape Pod. */
  perSystem: 100,
  perHint: -20,
  /** Naming the wrong suspect (or entering the wrong code) at the Escape Pod. */
  perWrongAccusation: -50,
  /** One bonus point for every this many seconds left on the clock. */
  secondsPerTimePoint: 3,
} as const

export type ScoreBreakdown = {
  systems: number
  time: number
  hints: number
  accusations: number
  total: number
}

/** Time only counts once the station is secured; a lost game scores what was solved. */
export function scoreGame(state: GameState): ScoreBreakdown {
  const solved = state.systems.filter((s) => s.status === 'solved').length
  const hintsUsed = state.systems.reduce((sum, s) => sum + s.hintsUsed, 0)
  const wrongAccusations = state.systems.find(isFinale)?.wrongAttempts ?? 0
  // Rounded up, like the clock, so "05:12 to spare" always scores 312 seconds.
  const secondsLeft = state.status === 'won' ? Math.ceil(timeLeftMs(state, state.endsAt) / 1000) : 0

  const systems = solved * POINTS.perSystem
  const time = Math.floor(secondsLeft / POINTS.secondsPerTimePoint)
  // `|| 0` turns -0 (0 × -20) into 0, so a debrief never shows "-0".
  const hints = hintsUsed * POINTS.perHint || 0
  const accusations = wrongAccusations * POINTS.perWrongAccusation || 0
  return {
    systems,
    time,
    hints,
    accusations,
    total: Math.max(0, systems + time + hints + accusations),
  }
}
