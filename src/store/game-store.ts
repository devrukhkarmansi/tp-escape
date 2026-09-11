import type { GameAction, GameState } from '../engine/game.ts'

/**
 * Where a game's state lives. The UI only talks to this, so solo play (LocalStore, in memory)
 * and multiplayer (Firestore, stage 3) can swap without touching any screen.
 * The shape matches React's useSyncExternalStore: getState + subscribe.
 */
export type GameStore = {
  getState(): GameState
  subscribe(listener: () => void): () => void
  dispatch(action: GameAction): void
}
