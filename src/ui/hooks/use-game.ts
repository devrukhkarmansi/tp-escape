import { useSyncExternalStore } from 'react'
import type { GameState } from '../../engine/game.ts'
import type { GameStore } from '../../store/game-store.ts'

/** Re-renders whenever the store's game changes. */
export function useGame(store: GameStore): GameState {
  return useSyncExternalStore(store.subscribe, store.getState)
}
