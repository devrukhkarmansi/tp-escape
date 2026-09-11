import { timeLeftMs, type GameState } from './game.ts'

export const POINTS = {
  perSystem: 100,
  perHint: -20,
  /** One bonus point for every this many seconds left on the clock. */
  secondsPerTimePoint: 3,
} as const

export type ScoreBreakdown = {
  systems: number
  time: number
  hints: number
  total: number
}

/** Time only counts once the station is secured; a lost game scores what was solved. */
export function scoreGame(state: GameState): ScoreBreakdown {
  const solved = state.systems.filter((s) => s.status === 'solved').length
  const hintsUsed = state.systems.reduce((sum, s) => sum + s.hintsUsed, 0)
  const secondsLeft =
    state.status === 'won' ? Math.floor(timeLeftMs(state, state.endsAt) / 1000) : 0

  const systems = solved * POINTS.perSystem
  const time = Math.floor(secondsLeft / POINTS.secondsPerTimePoint)
  // `|| 0` turns -0 (0 × -20) into 0, so a debrief never shows "-0".
  const hints = hintsUsed * POINTS.perHint || 0
  return { systems, time, hints, total: Math.max(0, systems + time + hints) }
}
