import type { PuzzleGenerator } from '../puzzle.ts'
import { flavor, pickWord } from './shared.ts'

/** Unscramble: the letters of a theme word, shuffled. Never shown in the right order. */
export const anagram: PuzzleGenerator = {
  kind: 'anagram',
  generate(rng, { level, theme }) {
    const word = pickWord(rng, theme.words, level)
    let scrambled = word
    for (let tries = 0; scrambled === word && tries < 20; tries++) {
      scrambled = rng.shuffle([...word]).join('')
    }
    const intro = flavor(rng, theme, 'anagram', 'Scrambled word')

    return {
      prompt: `${intro}. Put the letters back in order.`,
      display: scrambled,
      answer: word,
      hints: [
        `It's a ${word.length}-letter word from around the station.`,
        `It starts with ${word[0]}.`,
        `It starts with ${word.slice(0, 2)} and ends with ${word.at(-1)}.`,
      ],
    }
  },
}
