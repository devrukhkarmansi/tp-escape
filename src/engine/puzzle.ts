import type { Rng } from './rng.ts'
import type { ThemePack } from './theme.ts'

/** Puzzles that need a picture rather than text. The screen draws these; the engine only describes them. */
export type PuzzleVisual =
  /** A word in alien symbols, with a partial key. Glyphs are numbered 0–25. */
  | { type: 'glyphs'; glyphs: number[]; key: { glyph: number; letter: string }[] }
  /** A blinking, beeping beacon. `code` is dots and dashes, letters separated by spaces. */
  | { type: 'morse'; code: string; showText: boolean }
  /** Analog dials 0–9, read left to right. A reversed dial has its scale printed backwards. */
  | { type: 'gauges'; gauges: { value: number; reversed: boolean }[]; labelEvery: number }

export type Puzzle = {
  id: string
  kind: string
  prompt: string
  /** The thing to work on (coded message, number series), shown large and monospaced. */
  display?: string
  visual?: PuzzleVisual
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
