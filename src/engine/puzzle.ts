import type { Rng } from './rng.ts'
import type { ThemePack } from './theme.ts'

/** Puzzles that need a picture rather than text. The screen draws these; the engine only describes them. */
export type PuzzleVisual =
  /** A word in alien symbols, with a partial key. Glyphs are numbered 0–25. */
  | { type: 'glyphs'; glyphs: number[]; key: { glyph: number; letter: string }[] }
  /**
   * A blinking, beeping beacon. `code` is dots and dashes, letters separated by spaces.
   * `chart: false` when the Morse chart is a separate piece on someone else's screen.
   */
  | { type: 'morse'; code: string; showText: boolean; chart?: false }
  | { type: 'morse-chart' }
  /**
   * Analog dials 0–9, read left to right. A reversed dial has its scale printed backwards.
   * `firstDial` numbers the dials when this is only some of them (0 when absent).
   */
  | {
      type: 'gauges'
      gauges: { value: number; reversed: boolean }[]
      labelEvery: number
      firstDial?: number
    }

/**
 * One part of a split puzzle, such as the coded message or its key. In a crew each piece is dealt
 * to one player, so they have to talk; a player on their own sees every piece.
 */
export type PuzzlePiece = {
  /** What the piece is, shown to everyone: "Cipher key". */
  label: string
  text?: string
  display?: string
  visual?: PuzzleVisual
}

export type Puzzle = {
  id: string
  kind: string
  prompt: string
  /** The thing to work on (coded message, number series), shown large and monospaced. */
  display?: string
  visual?: PuzzleVisual
  /** Set on split puzzles, which show their pieces instead of `display` and `visual`. */
  pieces?: readonly PuzzlePiece[]
  answer: string
  altAnswers?: readonly string[]
  /** Revealed one at a time, easiest nudge first. */
  hints: readonly string[]
}

/** A generated puzzle, plus how to split it across players if its type allows that. */
export type GeneratedPuzzle = Omit<Puzzle, 'id' | 'kind' | 'pieces'> & {
  split?: { prompt: string; pieces: PuzzlePiece[] }
}

export type PuzzleContext = {
  /** 0 for the first system in a game, 1 for the last. Generators scale difficulty with it. */
  level: number
  theme: ThemePack
}

export type PuzzleGenerator = {
  kind: string
  generate(rng: Rng, context: PuzzleContext): GeneratedPuzzle
}
