import type { PuzzleGenerator } from '../puzzle.ts'
import { band, flavor } from './shared.ts'

/**
 * Gauge readings: dials from 0 to 9, read left to right into a code. Later on there are more
 * dials with fewer printed numbers, and one is mounted upside down, its scale running backwards.
 */
export const gauge: PuzzleGenerator = {
  kind: 'gauge',
  generate(rng, { level, theme }) {
    const stage = band(level)
    const count = stage === 0 ? 3 : 4
    const labelEvery = [1, 3, 9][stage]!
    const reversedAt = stage === 2 ? rng.int(0, count - 1) : -1
    const gauges = Array.from({ length: count }, (_, i) => ({
      value: rng.int(0, 9),
      reversed: i === reversedAt,
    }))
    const intro = flavor(rng, theme, 'gauge', 'Pressure gauges')

    return {
      prompt: `${intro}. Read each dial from left to right and enter the ${count} digits.${reversedAt >= 0 ? ' One dial was mounted upside down: its scale runs backwards.' : ''}`,
      visual: { type: 'gauges', gauges, labelEvery },
      answer: gauges.map((g) => g.value).join(''),
      hints: [
        'Each dial runs from 0 to 9. Read where its needle points.',
        reversedAt >= 0
          ? `Dial ${reversedAt + 1} counts down: 9 at the start of its scale, 0 at the end.`
          : 'Count the ticks from 0 if a number is not printed.',
        `The first dial reads ${gauges[0]!.value}.`,
      ],
    }
  },
}
