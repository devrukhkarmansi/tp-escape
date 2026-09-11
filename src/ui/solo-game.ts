import { spaceStation } from '../content/space-station/index.ts'
import { DIFFICULTIES, type DifficultyId } from '../engine/difficulty.ts'
import { createGame, type GameState } from '../engine/game.ts'
import { PUZZLE_GENERATORS } from '../engine/puzzles/index.ts'
import type { GameStore } from '../store/game-store.ts'
import { createLocalStore } from '../store/local-store.ts'
import { browserStorage, clearGame, loadGame, saveGame } from '../store/saved-game.ts'

export const SOLO_PLAYER_ID = 'solo'
export const THEME = spaceStation

function randomSeed(): number {
  return crypto.getRandomValues(new Uint32Array(1))[0]!
}

/** A fresh game with the current theme and puzzle types. Used by solo play and crew launches. */
export function newGame(difficultyId: DifficultyId, startedAt: number): GameState {
  const difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) ?? DIFFICULTIES[1]!
  return createGame({
    seed: randomSeed(),
    difficulty,
    theme: THEME,
    generators: PUZZLE_GENERATORS,
    startedAt,
  })
}

export function startSoloGame(difficultyId: DifficultyId): GameStore {
  return soloStore(newGame(difficultyId, Date.now()))
}

/** A game left running before the page reloaded, if it's still playable. */
export function resumeSoloGame(): GameStore | null {
  const saved = loadGame(browserStorage(), Date.now())
  return saved ? soloStore(saved) : null
}

export function abandonSoloGame(): void {
  clearGame(browserStorage())
}

function soloStore(game: GameState): GameStore {
  const storage = browserStorage()
  saveGame(storage, game)
  return createLocalStore(game, (state) => saveGame(storage, state))
}
