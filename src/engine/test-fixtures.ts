import { DIFFICULTIES, type Difficulty, type DifficultyId } from './difficulty.ts'
import { applyAction, createGame, type GameState, type NewGame } from './game.ts'
import type { PuzzleGenerator } from './puzzle.ts'
import type { ThemePack } from './theme.ts'

export const START = 1_000_000

export const testTheme: ThemePack = {
  id: 'test',
  name: 'Test Station',
  systemNames: Array.from({ length: 12 }, (_, i) => `System ${i + 1}`),
}

/** Stand-in for real puzzle types: "type the number shown". */
export function numberGenerator(kind: string): PuzzleGenerator {
  return {
    kind,
    generate: (rng) => {
      const n = rng.int(1, 9999)
      return {
        prompt: `Enter ${n}`,
        answer: String(n),
        hints: ['It is a number', `It starts with ${String(n)[0]}`],
      }
    },
  }
}

export const testGenerators = [
  numberGenerator('alpha'),
  numberGenerator('beta'),
  numberGenerator('gamma'),
]

export function difficulty(id: DifficultyId): Difficulty {
  const found = DIFFICULTIES.find((d) => d.id === id)
  if (!found) throw new Error(`Unknown difficulty ${id}`)
  return found
}

export function newTestGame(overrides: Partial<NewGame> = {}): GameState {
  return createGame({
    seed: 42,
    difficulty: difficulty('quick'),
    theme: testTheme,
    generators: testGenerators,
    startedAt: START,
    ...overrides,
  })
}

export function solve(state: GameState, systemId: string, at = START + 1_000): GameState {
  const system = state.systems.find((s) => s.id === systemId)
  if (!system) throw new Error(`No system ${systemId}`)
  return applyAction(state, {
    type: 'submit',
    systemId,
    answer: system.puzzle.answer,
    playerId: 'player-1',
    at,
  })
}

export function solveEverything(state: GameState, at = START + 1_000): GameState {
  let current = state
  while (current.status === 'playing') {
    const open = current.systems.find((s) => s.status === 'open')
    if (!open) throw new Error('Game is playing but nothing is open')
    current = solve(current, open.id, at)
  }
  return current
}
