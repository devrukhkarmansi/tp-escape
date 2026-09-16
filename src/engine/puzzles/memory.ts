import type { PuzzleGenerator } from '../puzzle.ts'
import { band, flavor } from './shared.ts'

/** Pads, steps and how fast the pattern plays, by stage. Longer and quicker as the shift goes on. */
const SHAPE = [
  { pads: 4, steps: 4, unitMs: 620 },
  { pads: 4, steps: 5, unitMs: 520 },
  { pads: 5, steps: 6, unitMs: 440 },
] as const

/**
 * Memory sequence: the nav array flashes and beeps a pattern of lit pads, and the crew plays it
 * back. Nothing to read at all, and the only puzzle where the sound carries real information.
 */
export const memory: PuzzleGenerator = {
  kind: 'memory',
  generate(rng, { level, theme }) {
    const { pads, steps, unitMs } = SHAPE[band(level)]!

    // No pad twice in a row: two flashes in the same place look like one long flash.
    const pattern: number[] = []
    while (pattern.length < steps) {
      const pad = rng.int(0, pads - 1)
      if (pad !== pattern.at(-1)) pattern.push(pad)
    }

    const answer = pattern.map((pad) => pad + 1).join('')
    const intro = flavor(rng, theme, 'memory', 'The nav array is running its start-up pattern')

    return {
      prompt: `${intro}. Watch the ${steps} flashes, then tap the pads back in the same order. Replay it as often as you need.`,
      visual: { type: 'memory', pattern, pads, unitMs },
      answer,
      hints: [
        'Replay plays the same pattern every time, so watch it twice before you touch anything.',
        'Say the pads out loud as they flash: the pads are numbered, and the notes rise from left to right.',
        `The pattern is ${pattern.map((pad) => pad + 1).join(' – ')}.`,
      ],
    }
  },
}
