import type { PuzzleGenerator } from '../puzzle.ts'
import { band, flavor, pickWord } from './shared.ts'

const A = 'A'.charCodeAt(0)

export function shiftLetters(text: string, by: number): string {
  return text.replace(/[A-Z]/g, (letter) => {
    const index = (letter.charCodeAt(0) - A + by) % 26
    return String.fromCharCode(A + ((index + 26) % 26))
  })
}

// Capped at 12: finding a big shift by hand is tedious rather than clever.
const SHIFT_RANGE_BY_STAGE = [
  [1, 3],
  [3, 9],
  [4, 12],
] as const

/**
 * Letter-shift code (a Caesar cipher). Early on the shift is stated; mid-game only one letter
 * pair is given; late-game players must find the shift themselves (at most 25 tries).
 */
export const caesar: PuzzleGenerator = {
  kind: 'caesar',
  generate(rng, { level, theme }) {
    const word = pickWord(rng, theme.words, level)
    const stage = band(level)
    const [min, max] = SHIFT_RANGE_BY_STAGE[stage]
    const shift = rng.int(min, max)
    const coded = shiftLetters(word, shift)
    const intro = flavor(rng, theme, 'caesar', 'Coded message')

    const instructions = [
      `Every letter was moved ${shift} ${shift === 1 ? 'place' : 'places'} forward in the alphabet.`,
      `Every letter was moved forward by the same amount. The first letter, ${coded[0]}, was ${word[0]}.`,
      'Every letter was moved forward by the same amount. Work out how far.',
    ][stage]!

    return {
      prompt: `${intro}. ${instructions}`,
      display: coded,
      answer: word,
      hints: [
        'Move each letter back along the alphabet by the same number of places.',
        `The shift is ${shift}, so ${coded[0]} goes back to ${word[0]}.`,
        `The word starts with ${word.slice(0, 2)}.`,
      ],
    }
  },
}
