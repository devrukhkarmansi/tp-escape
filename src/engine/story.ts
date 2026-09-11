import { timeLeftMs, type GameState } from './game.ts'
import { createRng } from './rng.ts'
import type { ThemePack, Transmission } from './theme.ts'

export type StoryBeat = 'opening' | 'newInfo' | 'twist' | 'emergency'

/**
 * When each story moment plays, as a fraction of the shift still left. They line up with the
 * alert levels: the twist lands as the station turns amber, the emergency as it turns red.
 */
export const STORY_BEATS: readonly { beat: StoryBeat; atFractionLeft: number }[] = [
  { beat: 'opening', atFractionLeft: 1 },
  { beat: 'newInfo', atFractionLeft: 0.75 },
  { beat: 'twist', atFractionLeft: 0.5 },
  { beat: 'emergency', atFractionLeft: 0.25 },
]

/** Every beat that has played so far, in order. Frozen while paused, like the clock. */
export function beatsDue(state: GameState, now: number): StoryBeat[] {
  if (state.status !== 'playing') return []
  const fractionLeft = timeLeftMs(state, now) / state.durationMs
  return STORY_BEATS.filter((b) => fractionLeft <= b.atFractionLeft).map((b) => b.beat)
}

// Each beat gets its own generator seeded from the game, so which version plays never depends on
// puzzle generation, and every phone in a crew picks the same one.
const BEAT_SALT: Record<StoryBeat | 'ending', number> = {
  opening: 0x1f3a,
  newInfo: 0x2b7c,
  twist: 0x3d91,
  emergency: 0x4e05,
  ending: 0x5a6f,
}

function pickFor<T>(state: GameState, key: StoryBeat | 'ending', options: readonly T[]): T {
  return createRng(state.seed ^ BEAT_SALT[key]).pick(options)
}

export function transmissionFor(state: GameState, theme: ThemePack, beat: StoryBeat): Transmission {
  return pickFor(state, beat, theme.story[beat])
}

/** HALCYON's last word on the debrief, for a win or a loss. */
export function endingFor(state: GameState, theme: ThemePack): string {
  return pickFor(state, 'ending', state.status === 'won' ? theme.story.won : theme.story.lost)
}
