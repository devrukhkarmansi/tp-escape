import type { PuzzleGenerator } from '../puzzle.ts'
import type { Rng } from '../rng.ts'
import { band, flavor, pickWord } from './shared.ts'

const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
export const GLYPH_COUNT = ALPHABET.length

/**
 * Could `candidate` be the hidden word? Known letters must match, and each missing symbol must
 * stand for one consistent letter that isn't already in the key.
 */
function fitsPattern(
  candidate: string,
  word: string,
  hidden: ReadonlySet<string>,
  inKey: ReadonlySet<string>,
): boolean {
  if (candidate.length !== word.length) return false
  const guesses = new Map<string, string>()
  for (let i = 0; i < word.length; i++) {
    const actual = word[i]!
    const letter = candidate[i]!
    if (!hidden.has(actual)) {
      if (letter !== actual) return false
      continue
    }
    if (inKey.has(letter)) return false
    const previous = guesses.get(actual)
    if (previous && previous !== letter) return false
    guesses.set(actual, letter)
  }
  // Two different missing symbols can't be the same letter.
  return new Set(guesses.values()).size === guesses.size
}

/** Picks which letters to leave out of the key so the theme's words still allow only one answer. */
function chooseHidden(
  rng: Rng,
  word: string,
  count: number,
  keyLetters: (hidden: ReadonlySet<string>) => ReadonlySet<string>,
  words: readonly string[],
): Set<string> {
  const letters = rng.shuffle([...new Set(word)])
  for (let n = Math.min(count, letters.length - 2); n > 0; n--) {
    for (let start = 0; start + n <= letters.length; start++) {
      const hidden = new Set(letters.slice(start, start + n))
      const inKey = keyLetters(hidden)
      const matches = words.filter((w) => fitsPattern(w, word, hidden, inKey))
      if (matches.length === 1) return hidden
    }
  }
  return new Set()
}

/** "One symbol is missing…", or nothing at all when the key is complete. */
function missingNote(count: number): string {
  if (count === 0) return ''
  const [symbol, it] = count === 1 ? ['One symbol is', 'it'] : ['Two symbols are', 'them']
  return ` ${symbol} missing from the key: work ${it} out from the word.`
}

/**
 * Alien glyphs: a theme word in symbols, with a partial key. Early the key covers every letter;
 * later one or two symbols are missing and must be worked out from the word. The missing symbols
 * are chosen so only one of the theme's words fits.
 */
export const glyph: PuzzleGenerator = {
  kind: 'glyph',
  generate(rng, { level, theme }) {
    const word = pickWord(rng, theme.words, level)
    const stage = band(level)
    const glyphFor = rng.shuffle(Array.from({ length: GLYPH_COUNT }, (_, i) => i))
    const glyphOf = (letter: string) => glyphFor[ALPHABET.indexOf(letter)]!
    const decoys = rng.shuffle([...ALPHABET].filter((l) => !word.includes(l))).slice(0, 3 + stage)

    const keyLetters = (hidden: ReadonlySet<string>) =>
      new Set([...new Set(word)].filter((l) => !hidden.has(l)).concat(decoys))
    const hidden = chooseHidden(rng, word, stage, keyLetters, theme.words)
    const key = rng
      .shuffle([...keyLetters(hidden)])
      .map((letter) => ({ glyph: glyphOf(letter), letter }))
    const missing = [...hidden]
    const intro = flavor(rng, theme, 'glyph', 'Alien inscription')

    const prompt = `${intro}. Translate the symbols using the key.${missingNote(missing.length)}`
    const glyphs = [...word].map(glyphOf)

    // On one screen the key hides a symbol or two, and you work them out from the word. Across two
    // screens the key is whole: its holder cannot see the word, so there is no pattern to work from.
    const splitKey = rng
      .shuffle([...keyLetters(new Set())])
      .map((letter) => ({ glyph: glyphOf(letter), letter }))

    return {
      prompt,
      visual: { type: 'glyphs', glyphs, key },
      split: {
        prompt: `${intro}. One of you has the inscription, the other the key. Translate the symbols between you.`,
        pieces: [
          { label: 'Inscription', visual: { type: 'glyphs', glyphs, key: [] } },
          { label: 'Symbol key', visual: { type: 'glyphs', glyphs: [], key: splitKey } },
        ],
      },
      answer: word,
      hints: [
        'Match each symbol to the key, one letter at a time.',
        `It's a ${word.length}-letter word from around the station.`,
        missing.length > 0
          ? `The missing ${missing.length === 1 ? 'letter is' : 'letters are'} ${missing.join(' and ')}.`
          : `It starts with ${word.slice(0, 2)}.`,
      ],
    }
  },
}
