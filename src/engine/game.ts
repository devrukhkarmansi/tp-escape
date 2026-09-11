import { checkAnswer } from './check-answer.ts'
import type { Difficulty, DifficultyId } from './difficulty.ts'
import type { Puzzle, PuzzleGenerator } from './puzzle.ts'
import { createRng, type Rng } from './rng.ts'
import type { ThemePack } from './theme.ts'

/** How many systems are workable at once, so a crew can split up. */
export const OPEN_AT_ONCE = 3

export type SystemStatus = 'locked' | 'open' | 'solved'

export type StationSystem = {
  id: string
  name: string
  puzzle: Puzzle
  status: SystemStatus
  hintsUsed: number
  wrongAttempts: number
  solvedBy?: string
  solvedAt?: number
}

export type GameStatus = 'playing' | 'won' | 'lost'

export type GameState = {
  seed: number
  difficultyId: DifficultyId
  themeId: string
  startedAt: number
  endsAt: number
  status: GameStatus
  endedAt?: number
  systems: readonly StationSystem[]
}

// Every action carries its own time (`at`) so the engine never reads the clock itself.
// That keeps it pure: the same state and action always give the same result.
export type GameAction =
  | { type: 'submit'; systemId: string; answer: string; playerId: string; at: number }
  | { type: 'hint'; systemId: string; at: number }
  | { type: 'tick'; at: number }

export type NewGame = {
  seed: number
  difficulty: Difficulty
  theme: ThemePack
  generators: readonly PuzzleGenerator[]
  startedAt: number
}

export function createGame({ seed, difficulty, theme, generators, startedAt }: NewGame): GameState {
  if (generators.length === 0) throw new Error('createGame needs at least one puzzle generator')
  if (theme.systemNames.length < difficulty.systems) {
    throw new Error(
      `Theme "${theme.id}" has ${theme.systemNames.length} system names; ${difficulty.name} needs ${difficulty.systems}`,
    )
  }

  // Draw order matters: names, then puzzle types, then one seed per system.
  // Changing this order changes every seed's game.
  const rng = createRng(seed)
  const names = rng.shuffle(theme.systemNames).slice(0, difficulty.systems)
  const chosen = spreadGenerators(rng, generators, difficulty.systems)
  const lastIndex = Math.max(1, difficulty.systems - 1)

  const systems = names.map((name, index): StationSystem => {
    const generator = chosen[index]!
    // Each system gets its own generator seeded from the game, so one puzzle type drawing more or
    // fewer random numbers never shifts the puzzles in other systems.
    const puzzleRng = createRng(rng.int(0, 0xffffffff))
    const puzzle = generator.generate(puzzleRng, { level: index / lastIndex, theme })
    return {
      id: `system-${index}`,
      name,
      puzzle: { id: `${generator.kind}-${index}`, kind: generator.kind, ...puzzle },
      status: index < OPEN_AT_ONCE ? 'open' : 'locked',
      hintsUsed: 0,
      wrongAttempts: 0,
    }
  })

  return {
    seed,
    difficultyId: difficulty.id,
    themeId: theme.id,
    startedAt,
    endsAt: startedAt + difficulty.minutes * 60_000,
    status: 'playing',
    systems,
  }
}

/** Uses every puzzle type before repeating any, so a game never leans on one kind. */
function spreadGenerators(
  rng: Rng,
  generators: readonly PuzzleGenerator[],
  count: number,
): PuzzleGenerator[] {
  const picked: PuzzleGenerator[] = []
  while (picked.length < count) picked.push(...rng.shuffle(generators))
  return picked.slice(0, count)
}

/**
 * The game's reducer: returns the next state, or the same object if the action changes nothing.
 * Returning the same object lets React skip re-rendering.
 */
export function applyAction(state: GameState, action: GameAction): GameState {
  if (state.status !== 'playing') return state
  if (action.at >= state.endsAt) return { ...state, status: 'lost', endedAt: state.endsAt }

  switch (action.type) {
    case 'tick':
      return state
    case 'hint':
      return revealHint(state, action.systemId)
    case 'submit':
      return submitAnswer(state, action)
  }
}

function revealHint(state: GameState, systemId: string): GameState {
  const system = state.systems.find((s) => s.id === systemId)
  if (!system || system.status !== 'open') return state
  if (system.hintsUsed >= system.puzzle.hints.length) return state
  return withSystem(state, systemId, { hintsUsed: system.hintsUsed + 1 })
}

function submitAnswer(
  state: GameState,
  { systemId, answer, playerId, at }: Extract<GameAction, { type: 'submit' }>,
): GameState {
  const system = state.systems.find((s) => s.id === systemId)
  if (!system || system.status !== 'open') return state

  if (!checkAnswer(system.puzzle, answer)) {
    return withSystem(state, systemId, { wrongAttempts: system.wrongAttempts + 1 })
  }

  const solved = withSystem(state, systemId, { status: 'solved', solvedBy: playerId, solvedAt: at })
  const nextLocked = solved.systems.find((s) => s.status === 'locked')
  const opened = nextLocked ? withSystem(solved, nextLocked.id, { status: 'open' }) : solved

  const allSolved = opened.systems.every((s) => s.status === 'solved')
  return allSolved ? { ...opened, status: 'won', endedAt: at } : opened
}

function withSystem(
  state: GameState,
  systemId: string,
  changes: Partial<StationSystem>,
): GameState {
  return {
    ...state,
    systems: state.systems.map((s) => (s.id === systemId ? { ...s, ...changes } : s)),
  }
}

/** Milliseconds left on the clock. Freezes when the game ends. */
export function timeLeftMs(state: GameState, now: number): number {
  return Math.max(0, state.endsAt - (state.endedAt ?? now))
}

export type AlertLevel = 'nominal' | 'caution' | 'critical'

/** Station alert tier: caution with half the time left, critical with a quarter left. */
export function alertLevel(state: GameState, now: number): AlertLevel {
  const fractionLeft = timeLeftMs(state, now) / (state.endsAt - state.startedAt)
  if (fractionLeft > 0.5) return 'nominal'
  if (fractionLeft > 0.25) return 'caution'
  return 'critical'
}
