import type { Rng } from '../rng.ts'
import type { PuzzleGenerator } from '../puzzle.ts'
import { band, flavor } from './shared.ts'

type Rule = { terms: number[]; explain: string }

const SHOWN = 5

const addEach = (rng: Rng): Rule => {
  const start = rng.int(1, 20)
  const step = rng.int(2, 9)
  return {
    terms: Array.from({ length: SHOWN + 1 }, (_, i) => start + step * i),
    explain: `Each reading goes up by ${step}.`,
  }
}

const multiplyEach = (rng: Rng): Rule => {
  const start = rng.int(1, 5)
  const factor = rng.int(2, 3)
  return {
    terms: Array.from({ length: SHOWN + 1 }, (_, i) => start * factor ** i),
    explain: `Each reading is ${factor === 2 ? 'double' : 'three times'} the one before.`,
  }
}

const alternatingSteps = (rng: Rng): Rule => {
  const start = rng.int(1, 15)
  const a = rng.int(2, 6)
  const b = rng.int(7, 12)
  const terms = [start]
  for (let i = 1; i <= SHOWN; i++) terms.push(terms[i - 1]! + (i % 2 === 1 ? a : b))
  return { terms, explain: `The gap alternates: +${a}, then +${b}.` }
}

const growingSteps = (rng: Rng): Rule => {
  const start = rng.int(1, 10)
  const firstStep = rng.int(1, 4)
  const terms = [start]
  for (let i = 1; i <= SHOWN; i++) terms.push(terms[i - 1]! + firstStep + (i - 1))
  return { terms, explain: `The gap grows by one each time: +${firstStep}, +${firstStep + 1}, …` }
}

const sumOfTwo = (rng: Rng): Rule => {
  const terms = [rng.int(1, 5), rng.int(2, 8)]
  while (terms.length < SHOWN + 1) terms.push(terms.at(-1)! + terms.at(-2)!)
  return { terms, explain: 'Each reading is the sum of the two before it.' }
}

const squaresPlus = (rng: Rng): Rule => {
  const offset = rng.int(0, 9)
  const first = rng.int(1, 4)
  return {
    terms: Array.from({ length: SHOWN + 1 }, (_, i) => (first + i) ** 2 + offset),
    explain: `They're square numbers${offset ? ` plus ${offset}` : ''}: ${first}×${first}${offset ? ` + ${offset}` : ''}, …`,
  }
}

const RULES_BY_BAND = [
  [addEach],
  [multiplyEach, alternatingSteps],
  [growingSteps, sumOfTwo, squaresPlus],
]

/** Number pattern: five readings follow a rule; enter the sixth. Rules get trickier by stage. */
export const sequence: PuzzleGenerator = {
  kind: 'sequence',
  generate(rng, { level, theme }) {
    const rule = rng.pick(RULES_BY_BAND[band(level)]!)(rng)
    const shown = rule.terms.slice(0, SHOWN)
    const next = rule.terms[SHOWN]!
    const intro = flavor(rng, theme, 'sequence', 'Sensor readings')

    return {
      prompt: `${intro}. What comes next?`,
      display: shown.join(', '),
      answer: String(next),
      hints: ['Look at how much each number changes from the one before.', rule.explain],
    }
  },
}
