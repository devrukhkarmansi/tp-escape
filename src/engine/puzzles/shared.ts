import type { Rng } from '../rng.ts'
import type { ThemePack } from '../theme.ts'

/** Longer words as the game goes on: 4–6 letters at level 0, up to 7–9 at level 1. */
export function pickWord(rng: Rng, words: readonly string[], level: number): string {
  const min = 4 + Math.round(level * 3)
  const fitting = words.filter((w) => w.length >= min && w.length <= min + 2)
  return rng.pick(fitting.length > 0 ? fitting : words)
}

export function flavor(rng: Rng, theme: ThemePack, kind: string, fallback: string): string {
  const options = theme.flavor[kind]
  return options && options.length > 0 ? rng.pick(options) : fallback
}

/** Low, mid or high third of the game, for generators that change rules by stage. */
export function band(level: number): 0 | 1 | 2 {
  if (level < 1 / 3) return 0
  if (level < 2 / 3) return 1
  return 2
}
