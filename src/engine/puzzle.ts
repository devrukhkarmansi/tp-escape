import type { Rng } from './rng.ts'
import type { ThemePack } from './theme.ts'

export type Puzzle = {
  id: string
  kind: string
  prompt: string
  answer: string
  altAnswers?: readonly string[]
  /** Revealed one at a time, easiest nudge first. */
  hints: readonly string[]
}

export type PuzzleContext = {
  /** 0 for the first system in a game, 1 for the last. Generators scale difficulty with it. */
  level: number
  theme: ThemePack
}

export type PuzzleGenerator = {
  kind: string
  generate(rng: Rng, context: PuzzleContext): Omit<Puzzle, 'id' | 'kind'>
}
