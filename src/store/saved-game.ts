import type { GameState } from '../engine/game.ts'

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

const KEY = 'tp-escape:solo-game'
// Bump when GameState's shape changes, so an old save is ignored instead of breaking the game.
const VERSION = 1

type Saved = { version: number; state: GameState }

/** localStorage, or undefined where the browser blocks it (some private modes throw on access). */
export function browserStorage(): KeyValueStorage | undefined {
  try {
    return window.localStorage
  } catch {
    return undefined
  }
}

export function saveGame(storage: KeyValueStorage | undefined, state: GameState): void {
  try {
    storage?.setItem(KEY, JSON.stringify({ version: VERSION, state } satisfies Saved))
  } catch {
    // Storage full or blocked: the game carries on, it just won't survive a reload.
  }
}

/** The saved game, but only if it's still playable right now. */
export function loadGame(storage: KeyValueStorage | undefined, now: number): GameState | null {
  try {
    const raw = storage?.getItem(KEY)
    if (!raw) return null
    const saved = JSON.parse(raw) as Partial<Saved>
    const state = saved.state
    if (saved.version !== VERSION || !state || state.status !== 'playing') return null
    if (now >= state.endsAt) return null
    return state
  } catch {
    return null
  }
}

export function clearGame(storage: KeyValueStorage | undefined): void {
  try {
    storage?.removeItem(KEY)
  } catch {
    // Nothing to clear if storage is blocked.
  }
}
