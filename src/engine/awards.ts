import { isFinale, type GameState, type StationSystem } from './game.ts'

/** Awards handed out at the debrief. `playerId` is absent when the award is the whole crew's. */
export type Award = {
  id: string
  title: string
  description: string
  playerId?: string
}

/** Solving with less than this left on the clock counts as clutch. */
const CLUTCH_MS = 60_000

const solvedSystems = (state: GameState) =>
  state.systems.filter((s) => s.status === 'solved' && !isFinale(s))

/** The player who did the most of something, or nobody when it's a tie or nobody qualifies. */
function topPlayer(counts: Map<string, number>): string | undefined {
  const ranked = [...counts].sort(([aId, a], [bId, b]) => b - a || aId.localeCompare(bId))
  const [first, second] = ranked
  if (!first || first[1] === 0) return undefined
  return second && second[1] === first[1] ? undefined : first[0]
}

function countBy(systems: readonly StationSystem[], keep: (s: StationSystem) => boolean) {
  const counts = new Map<string, number>()
  for (const system of systems) {
    if (!system.solvedBy || !keep(system)) continue
    counts.set(system.solvedBy, (counts.get(system.solvedBy) ?? 0) + 1)
  }
  return counts
}

/**
 * The debrief's awards: a few true, cheerful facts about the run. Nothing here is a telling-off,
 * and every award is worked out from the finished game, so every phone shows the same ones.
 */
export function awardsFor(state: GameState, crewSize = 1): Award[] {
  const solved = solvedSystems(state)
  const awards: Award[] = []
  const hintsUsed = state.systems.reduce((sum, s) => sum + s.hintsUsed, 0)
  const escapePod = state.systems.find(isFinale)

  if (crewSize > 1) {
    const mastermind = topPlayer(countBy(solved, () => true))
    if (mastermind) {
      awards.push({
        id: 'mastermind',
        title: 'Mastermind',
        description: 'Restored more systems than anyone else.',
        playerId: mastermind,
      })
    }

    const comms = topPlayer(countBy(solved, (s) => !!s.puzzle.pieces))
    if (comms) {
      awards.push({
        id: 'comms',
        title: 'Comms MVP',
        description: 'Cracked the most systems that needed two screens.',
        playerId: comms,
      })
    }

    const curious = topPlayer(
      new Map(
        state.systems
          .filter((s) => s.solvedBy && s.hintsUsed > 0)
          .map((s) => [s.solvedBy!, s.hintsUsed]),
      ),
    )
    if (curious && hintsUsed >= 3) {
      awards.push({
        id: 'curious',
        title: 'Curious Mind',
        description: 'Asked HALCYON the most questions. No shame in reading the manual.',
        playerId: curious,
      })
    }
  }

  // Newest solve first, so "clutch" is about the end of the shift.
  const latest = [...solved].sort((a, b) => (b.solvedAt ?? 0) - (a.solvedAt ?? 0))[0]
  if (latest && state.endsAt - (latest.solvedAt ?? 0) < CLUTCH_MS) {
    awards.push({
      id: 'clutch',
      title: 'Clutch',
      description: `Restored ${latest.name} with under a minute left.`,
      ...(latest.solvedBy && { playerId: latest.solvedBy }),
    })
  }

  if (solved.length > 0 && hintsUsed === 0) {
    awards.push({
      id: 'unaided',
      title: 'No Hints Needed',
      description: 'Not one hint the whole shift.',
    })
  }

  if (state.status === 'won' && escapePod?.wrongAttempts === 0) {
    awards.push({
      id: 'eagle-eye',
      title: 'Eagle Eye',
      description: 'Named the traitor first time, with the right launch code.',
    })
  }

  if (
    state.status === 'won' &&
    state.endsAt - (state.endedAt ?? state.endsAt) > state.durationMs / 2
  ) {
    awards.push({
      id: 'early-shift',
      title: 'Early Shift',
      description: 'Off the station with more than half the clock unused.',
    })
  }

  return awards
}
