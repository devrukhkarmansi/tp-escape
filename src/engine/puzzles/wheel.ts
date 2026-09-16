import type { PuzzleGenerator } from '../puzzle.ts'
import { shiftLetters } from './caesar.ts'
import { flavor, pickWord } from './shared.ts'

/**
 * Cipher wheel: the same letter-shift idea as the coded message, but you turn a ring instead of
 * doing the arithmetic. The whole message decodes as the ring moves, so the puzzle is spotting the
 * moment it turns into a word.
 */
export const wheel: PuzzleGenerator = {
  kind: 'wheel',
  generate(rng, { level, theme }) {
    const word = pickWord(rng, theme.words, level)
    // Every shift is as easy as any other on a wheel, so 0 is the only one worth avoiding.
    const shift = rng.int(1, 25)
    const coded = shiftLetters(word, shift)
    const intro = flavor(rng, theme, 'wheel', 'A cipher wheel is bolted to the bulkhead')

    return {
      prompt: `${intro}. Turn the ring until the message reads as a word, then send it.`,
      visual: { type: 'wheel', coded },
      answer: word,
      hints: [
        'Every letter moves together, so the whole message changes as you turn the ring. Stop when it reads as a word.',
        `It's a ${word.length}-letter word from around the station, starting with ${word[0]}.`,
        `The ring is ${shift} steps out: ${coded[0]} is really ${word[0]}.`,
      ],
    }
  },
}
