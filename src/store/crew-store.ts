import { applyAction, type GameAction, type GameState } from '../engine/game.ts'
import type { GameStore } from './game-store.ts'

export type CrewStore = GameStore & {
  /** The latest game from Firestore. The server's version always wins. */
  receive(state: GameState): void
}

/**
 * The multiplayer GameStore. Screens use it exactly like the solo LocalStore.
 * Actions apply locally straight away (so a solve or hint feels instant), then go to Firestore;
 * the next snapshot from the server replaces the local guess.
 */
export function createCrewStore(
  initial: GameState,
  send: (action: GameAction) => Promise<void>,
  onError: (error: unknown) => void,
): CrewStore {
  let state = initial
  const listeners = new Set<() => void>()

  const set = (next: GameState) => {
    if (next === state) return
    state = next
    for (const listener of listeners) listener()
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => {
        listeners.delete(listener)
      }
    },
    dispatch(action) {
      set(applyAction(state, action))
      send(action).catch(onError)
    },
    receive: set,
  }
}
