import { DIFFICULTIES, type Difficulty, type DifficultyId } from './difficulty.ts'
import { applyAction, createGame, isFinale, type GameState, type NewGame } from './game.ts'
import type { PuzzleGenerator } from './puzzle.ts'
import type { ThemePack } from './theme.ts'

export const START = 1_000_000

export const testTheme: ThemePack = {
  id: 'test',
  name: 'Test Station',
  systemNames: Array.from({ length: 12 }, (_, i) => `System ${i + 1}`),
  words: [
    'CRYO',
    'HULL',
    'FUEL',
    'CARGO',
    'ORBIT',
    'RADAR',
    'OXYGEN',
    'PLANET',
    'ROCKET',
    'AIRLOCK',
    'REACTOR',
    'GRAVITY',
    'ASTEROID',
    'THRUSTER',
    'SATELLITE',
    'TELESCOPE',
  ],
  riddles: [
    { question: 'What has a face and two hands?', answer: 'clock', hints: ['It ticks'] },
    { question: 'What gets wetter as it dries?', answer: 'towel', hints: ['Bathroom'] },
    { question: 'What has one eye but cannot see?', answer: 'needle', hints: ['Sewing'] },
    { question: 'What has a neck but no head?', answer: 'bottle', hints: ['Drinks'] },
  ],
  flavor: {},
  story: {
    opening: [1, 2, 3].map((n) => ({ from: 'TEST', lines: [`Opening ${n}`] })),
    newInfo: [1, 2, 3].map((n) => ({ from: 'TEST', lines: [`New info ${n}`] })),
    twist: [1, 2, 3].map((n) => ({ from: 'TEST', lines: [`Twist ${n}`] })),
    emergency: [1, 2, 3].map((n) => ({ from: 'TEST', lines: [`Emergency ${n}`] })),
    won: ['Won 1', 'Won 2', 'Won 3'],
    lost: ['Lost 1', 'Lost 2', 'Lost 3'],
  },
  mystery: {
    finaleSystemName: 'Escape Pod',
    suspects: ['a', 'b', 'c', 'd', 'e'].map((id) => ({
      id,
      name: `Suspect ${id.toUpperCase()}`,
      role: `Role ${id}`,
    })),
    items: ['the item one', 'the item two', 'the item three'],
    places: ['in place one', 'in place two', 'in place three'],
    alibis: ['{name} was elsewhere (alibi 1).', '{name} was asleep (alibi 2).'],
    itemClues: ['Missing: {item}.'],
    placeClues: ['Hidden {place}.'],
    logs: Array.from({ length: 10 }, (_, i) => `Log ${i + 1} mentions {name}.`),
  },
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

/** Names the right traitor with the right launch code. */
export function launchEscapePod(state: GameState, at = START + 1_000): GameState {
  const escapePod = state.systems.find(isFinale)
  if (!escapePod) throw new Error('No Escape Pod')
  return applyAction(state, {
    type: 'accuse',
    suspectId: state.mystery.culpritId,
    code: escapePod.puzzle.answer,
    playerId: 'player-1',
    at,
  })
}

export function solve(state: GameState, systemId: string, at = START + 1_000): GameState {
  const system = state.systems.find((s) => s.id === systemId)
  if (!system) throw new Error(`No system ${systemId}`)
  if (isFinale(system)) return launchEscapePod(state, at)
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
