import { checkAnswer, normalizeAnswer } from './check-answer.ts'
import type { Difficulty, DifficultyId } from './difficulty.ts'
import { createMystery, FINALE_KIND, type Mystery } from './mystery.ts'
import type { GeneratedPuzzle, Puzzle, PuzzleContext, PuzzleGenerator } from './puzzle.ts'
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
  /** Shift length. Stays fixed; `endsAt` moves later each time the game resumes from a pause. */
  durationMs: number
  endsAt: number
  /** Set while paused. Absent (never undefined) otherwise, because Firestore rejects undefined. */
  pausedAt?: number
  status: GameStatus
  endedAt?: number
  /** The puzzle systems in board order, then the Escape Pod finale last. */
  systems: readonly StationSystem[]
  mystery: Mystery
}

// Every action carries its own time (`at`) so the engine never reads the clock itself.
// That keeps it pure: the same state and action always give the same result.
export type GameAction =
  | { type: 'submit'; systemId: string; answer: string; playerId: string; at: number }
  | { type: 'hint'; systemId: string; at: number }
  | { type: 'tick'; at: number }
  | { type: 'pause'; at: number }
  | { type: 'resume'; at: number }
  /** The finale: name the traitor and enter the launch code, both at once. */
  | { type: 'accuse'; suspectId: string; code: string; playerId: string; at: number }

export type NewGame = {
  seed: number
  difficulty: Difficulty
  theme: ThemePack
  generators: readonly PuzzleGenerator[]
  startedAt: number
  /** Crew games split some puzzles into pieces dealt to different players. */
  splitPuzzles?: boolean
}

/** About one system in three is split in a crew game. */
const SPLIT_EVERY = 3
const SPLIT_SALT = 0x5b17

export function createGame({
  seed,
  difficulty,
  theme,
  generators,
  startedAt,
  splitPuzzles = false,
}: NewGame): GameState {
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
  const usedAnswers = new Set<string>()

  const generated = names.map((_, index) => {
    const generator = chosen[index]!
    // Each system gets its own seed drawn from the game's, so one puzzle type drawing more or
    // fewer random numbers never shifts the puzzles in other systems.
    const systemSeed = rng.int(0, 0xffffffff)
    const context = { level: index / lastIndex, theme }
    const puzzle = generateUnique(generator, systemSeed, context, usedAnswers)
    usedAnswers.add(normalizeAnswer(puzzle.answer))
    return { kind: generator.kind, puzzle }
  })

  // Which systems split uses its own random stream, so it never changes the puzzles themselves.
  const splittable = generated.flatMap(({ puzzle }, index) => (puzzle.split ? [index] : []))
  const splitCount = splitPuzzles ? Math.max(1, Math.round(difficulty.systems / SPLIT_EVERY)) : 0
  const splitAt = new Set(
    createRng(seed ^ SPLIT_SALT)
      .shuffle(splittable)
      .slice(0, splitCount),
  )

  const systems = generated.map(({ kind, puzzle }, index): StationSystem => {
    const { split, ...shown } = puzzle
    if (split && splitAt.has(index)) {
      // A split puzzle shows its pieces instead of the whole display or picture.
      delete shown.display
      delete shown.visual
      Object.assign(shown, split)
    }
    return {
      id: `system-${index}`,
      name: names[index]!,
      puzzle: { id: `${kind}-${index}`, kind, ...shown },
      status: index < OPEN_AT_ONCE ? 'open' : 'locked',
      hintsUsed: 0,
      wrongAttempts: 0,
    }
  })

  const { mystery, finale } = createMystery(
    seed,
    theme,
    systems.map((s) => ({ name: s.name, answer: s.puzzle.answer })),
  )
  const escapePod: StationSystem = {
    id: 'system-finale',
    name: theme.mystery.finaleSystemName,
    puzzle: { id: FINALE_KIND, ...finale },
    status: 'locked',
    hintsUsed: 0,
    wrongAttempts: 0,
  }

  const durationMs = difficulty.minutes * 60_000
  return {
    seed,
    difficultyId: difficulty.id,
    themeId: theme.id,
    startedAt,
    durationMs,
    endsAt: startedAt + durationMs,
    status: 'playing',
    systems: [...systems, escapePod],
    mystery,
  }
}

export function isFinale(system: StationSystem): boolean {
  return system.puzzle.kind === FINALE_KIND
}

const MAX_ATTEMPTS = 20

/**
 * No two systems in a game share an answer. Retries use variations of the system's own seed,
 * never the game's generator, so a retry here can't change any other system.
 */
function generateUnique(
  generator: PuzzleGenerator,
  systemSeed: number,
  context: PuzzleContext,
  usedAnswers: ReadonlySet<string>,
): GeneratedPuzzle {
  let puzzle = generator.generate(createRng(systemSeed), context)
  for (let attempt = 1; attempt < MAX_ATTEMPTS; attempt++) {
    if (!usedAnswers.has(normalizeAnswer(puzzle.answer))) break
    puzzle = generator.generate(createRng(systemSeed + attempt * 0x9e3779b9), context)
  }
  return puzzle
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

  // While paused the clock is frozen and only "resume" does anything.
  if (state.pausedAt !== undefined) {
    if (action.type !== 'resume') return state
    const { pausedAt, ...running } = state
    return { ...running, endsAt: state.endsAt + Math.max(0, action.at - pausedAt) }
  }

  if (action.at >= state.endsAt) return { ...state, status: 'lost', endedAt: state.endsAt }

  switch (action.type) {
    case 'tick':
    case 'resume':
      return state
    case 'pause':
      return { ...state, pausedAt: action.at }
    case 'hint':
      return revealHint(state, action.systemId)
    case 'submit':
      return submitAnswer(state, action)
    case 'accuse':
      return accuse(state, action)
  }
}

export function isPaused(state: GameState): boolean {
  return state.pausedAt !== undefined
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
  // The Escape Pod takes an accusation, not a typed answer.
  if (!system || system.status !== 'open' || isFinale(system)) return state

  if (!checkAnswer(system.puzzle, answer)) {
    return withSystem(state, systemId, { wrongAttempts: system.wrongAttempts + 1 })
  }

  const solved = withSystem(state, systemId, { status: 'solved', solvedBy: playerId, solvedAt: at })
  return openNext(solved)
}

/** Opens the next locked puzzle system; the Escape Pod only once every other system is restored. */
function openNext(state: GameState): GameState {
  const nextLocked = state.systems.find((s) => s.status === 'locked' && !isFinale(s))
  if (nextLocked) return withSystem(state, nextLocked.id, { status: 'open' })

  const escapePod = state.systems.find(isFinale)
  const othersRestored = state.systems.every((s) => isFinale(s) || s.status === 'solved')
  if (escapePod?.status === 'locked' && othersRestored) {
    return withSystem(state, escapePod.id, { status: 'open' })
  }
  return state
}

/** Right traitor and right launch code: the pod launches and the crew wins. Otherwise it's refused. */
function accuse(
  state: GameState,
  { suspectId, code, playerId, at }: Extract<GameAction, { type: 'accuse' }>,
): GameState {
  const escapePod = state.systems.find(isFinale)
  if (!escapePod || escapePod.status !== 'open') return state

  const correct = suspectId === state.mystery.culpritId && checkAnswer(escapePod.puzzle, code)
  if (!correct) {
    return withSystem(state, escapePod.id, { wrongAttempts: escapePod.wrongAttempts + 1 })
  }

  const launched = withSystem(state, escapePod.id, {
    status: 'solved',
    solvedBy: playerId,
    solvedAt: at,
  })
  return { ...launched, status: 'won', endedAt: at }
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

/** Milliseconds left on the clock. Freezes while paused and when the game ends. */
export function timeLeftMs(state: GameState, now: number): number {
  return Math.max(0, state.endsAt - (state.endedAt ?? state.pausedAt ?? now))
}

export type AlertLevel = 'nominal' | 'caution' | 'critical'

/** Station alert tier: caution with half the time left, critical with a quarter left. */
export function alertLevel(state: GameState, now: number): AlertLevel {
  const fractionLeft = timeLeftMs(state, now) / state.durationMs
  if (fractionLeft > 0.5) return 'nominal'
  if (fractionLeft > 0.25) return 'caution'
  return 'critical'
}
