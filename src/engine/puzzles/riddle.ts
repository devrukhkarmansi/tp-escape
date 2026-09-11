import type { PuzzleGenerator } from '../puzzle.ts'
import { flavor } from './shared.ts'

/** A riddle from the theme's written bank. The only puzzle type that isn't generated. */
export const riddle: PuzzleGenerator = {
  kind: 'riddle',
  generate(rng, { theme }) {
    const chosen = rng.pick(theme.riddles)
    const intro = flavor(rng, theme, 'riddle', 'Voice lock')

    return {
      prompt: `${intro}. Answer the riddle to continue.`,
      display: chosen.question,
      answer: chosen.answer,
      altAnswers: chosen.altAnswers,
      hints: chosen.hints,
    }
  },
}
