import type { PuzzleGenerator } from '../puzzle.ts'
import { band, flavor } from './shared.ts'

export const MORSE: Readonly<Record<string, string>> = {
  A: '.-',
  B: '-...',
  C: '-.-.',
  D: '-..',
  E: '.',
  F: '..-.',
  G: '--.',
  H: '....',
  I: '..',
  J: '.---',
  K: '-.-',
  L: '.-..',
  M: '--',
  N: '-.',
  O: '---',
  P: '.--.',
  Q: '--.-',
  R: '.-.',
  S: '...',
  T: '-',
  U: '..-',
  V: '...-',
  W: '.--',
  X: '-..-',
  Y: '-.--',
  Z: '--..',
}

export function toMorse(word: string): string {
  return [...word].map((letter) => MORSE[letter]!).join(' ')
}

/**
 * Morse beacon: a short word blinked and beeped in Morse code. Early the dots and dashes are also
 * written out; later players watch the light or listen, and the written signal becomes a hint.
 */
export const morse: PuzzleGenerator = {
  kind: 'morse',
  generate(rng, { level, theme }) {
    const stage = band(level)
    // Morse gets long fast, so keep to short words: 4 letters early, up to 5 later.
    const maxLength = stage === 0 ? 4 : 5
    const words = theme.words.filter((w) => w.length >= 4 && w.length <= maxLength)
    const word = rng.pick(words.length > 0 ? words : theme.words)
    const code = toMorse(word)
    const showText = stage === 0
    const intro = flavor(rng, theme, 'morse', 'Distress beacon')

    const prompt = `${intro}. The signal is a ${word.length}-letter word in Morse code.${showText ? ' It is written out below too.' : ' Watch the light or listen to the beeps.'}`

    return {
      prompt,
      visual: { type: 'morse', code, showText },
      // Split: one player watches the beacon, another has the chart to decode it.
      split: {
        prompt,
        pieces: [
          { label: 'Beacon', visual: { type: 'morse', code, showText, chart: false } },
          { label: 'Morse chart', visual: { type: 'morse-chart' } },
        ],
      },
      answer: word,
      hints: [
        'Short flashes are dots, long ones are dashes. A longer pause means a new letter.',
        `The signal, written out: ${code.replaceAll(' ', '  /  ')}`,
        `The word starts with ${word[0]}.`,
      ],
    }
  },
}
