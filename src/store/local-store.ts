import { applyAction, type GameState } from '../engine/game.ts'
import type { GameStore } from './game-store.ts'

/** A game that lives on this device only. `onChange` runs after every real change (e.g. to save). */
export function createLocalStore(
  initial: GameState,
  onChange?: (state: GameState) => void,
): GameStore {
  let state = initial
  const listeners = new Set<() => void>()

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispatch(action) {
      const next = applyAction(state, action)
      if (next === state) return
      state = next
      onChange?.(state)
      for (const listener of listeners) listener()
    },
  }
}
