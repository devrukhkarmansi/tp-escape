import type { Puzzle } from '../engine/puzzle.ts'

/**
 * How you answer a puzzle. Tapping beats typing on a phone: the on-screen keyboard covers half
 * the puzzle, and these pads only offer what the answer could possibly be.
 */
export type AnswerMode =
  /** A keypad, for answers that are all digits: gauges, number patterns, wire numbers. */
  | 'digits'
  /** The scrambled word's own letters, each usable once. */
  | 'tiles'
  /** A compact A–Z pad, for answers that are one plain word. */
  | 'letters'
  /** A normal text box: riddles, and anything with spaces or punctuation. */
  | 'text'

export function answerMode(puzzle: Puzzle): AnswerMode {
  if (/^\d+$/.test(puzzle.answer)) return 'digits'
  // Riddles are sentences as often as words ("a towel"), so they keep the keyboard.
  if (puzzle.kind === 'riddle') return 'text'
  if (puzzle.kind === 'anagram' && puzzle.display && /^[A-Za-z]+$/.test(puzzle.display)) {
    return 'tiles'
  }
  return /^[A-Za-z]+$/.test(puzzle.answer) ? 'letters' : 'text'
}

/** The letters a tile pad offers, in the order the puzzle shows them. */
export function tilesFor(puzzle: Puzzle): string[] {
  return [...(puzzle.display ?? '')].map((letter) => letter.toUpperCase())
}

/**
 * Which tiles are still free, given what has been typed so far. A letter appearing twice in the
 * scramble can be used twice, so this counts rather than just checking membership.
 */
export function usedTiles(tiles: readonly string[], typed: string): boolean[] {
  const left = new Map<string, number>()
  for (const letter of typed.toUpperCase()) left.set(letter, (left.get(letter) ?? 0) + 1)
  return tiles.map((tile) => {
    const count = left.get(tile) ?? 0
    if (count === 0) return false
    left.set(tile, count - 1)
    return true
  })
}
