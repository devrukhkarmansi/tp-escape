import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../check-answer.ts'
import type { Puzzle, PuzzleGenerator } from '../puzzle.ts'
import { createRng } from '../rng.ts'
import { testTheme } from '../test-fixtures.ts'
import { anagram } from './anagram.ts'
import { caesar, shiftLetters } from './caesar.ts'
import { PUZZLE_GENERATORS } from './index.ts'
import { riddle } from './riddle.ts'
import { sequence } from './sequence.ts'

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1)
const LEVELS = [0, 0.5, 1]

type Generated = Omit<Puzzle, 'id' | 'kind'> & { seed: number; level: number }

function everyPuzzle(generator: PuzzleGenerator, levels = LEVELS): Generated[] {
  return SEEDS.flatMap((seed) =>
    levels.map((level) => ({
      seed,
      level,
      ...generator.generate(createRng(seed), { level, theme: testTheme }),
    })),
  )
}

/** Collects the seeds that fail a check, so a failure names them instead of stopping at one. */
function failing(puzzles: Generated[], check: (p: Generated) => boolean) {
  return puzzles.filter((p) => !check(p)).map(({ seed, level }) => ({ seed, level }))
}

describe.each(PUZZLE_GENERATORS.map((g) => [g.kind, g] as const))('%s', (_kind, generator) => {
  const puzzles = everyPuzzle(generator)

  it('is solvable by its own answer for 1,000 seeds at every stage', () => {
    expect(failing(puzzles, (p) => checkAnswer(p, p.answer))).toEqual([])
  })

  it('always has a prompt, something to show, and at least one hint', () => {
    expect(
      failing(puzzles, (p) => p.prompt.length > 0 && !!p.display && p.hints.length > 0),
    ).toEqual([])
  })

  it('builds the same puzzle from the same seed', () => {
    const make = () => generator.generate(createRng(99), { level: 0.5, theme: testTheme })
    expect(make()).toEqual(make())
  })
})

describe('caesar', () => {
  it('shifts letters and wraps around the alphabet', () => {
    expect(shiftLetters('XYZ', 3)).toBe('ABC')
    expect(shiftLetters('ABC', -3)).toBe('XYZ')
  })

  it('early on, the stated shift really decodes the message', () => {
    const early = everyPuzzle(caesar, [0])
    expect(
      failing(early, (p) => {
        const stated = Number(/moved (\d+) places? forward/.exec(p.prompt)?.[1])
        return shiftLetters(p.answer, stated) === p.display
      }),
    ).toEqual([])
  })

  it('mid-game, the given letter pair is correct', () => {
    const mid = everyPuzzle(caesar, [0.5])
    expect(failing(mid, (p) => p.prompt.includes(`${p.display![0]}, was ${p.answer[0]}`))).toEqual(
      [],
    )
  })

  it('says "1 place", not "1 places"', () => {
    expect(everyPuzzle(caesar, [0]).filter((p) => p.prompt.includes(' 1 places'))).toEqual([])
  })

  it('late-game, exactly one shift decodes the message', () => {
    const late = everyPuzzle(caesar, [1])
    expect(
      failing(late, (p) => {
        const decodes = Array.from({ length: 25 }, (_, i) => i + 1).filter(
          (s) => shiftLetters(p.display!, -s) === p.answer,
        )
        return decodes.length === 1
      }),
    ).toEqual([])
  })

  it('uses longer words later in the game', () => {
    const lengths = (level: number) => everyPuzzle(caesar, [level]).map((p) => p.answer.length)
    expect(Math.max(...lengths(0))).toBeLessThanOrEqual(6)
    expect(Math.min(...lengths(1))).toBeGreaterThanOrEqual(7)
  })
})

describe('anagram', () => {
  it('never shows the word in the right order, and uses exactly its letters', () => {
    const sorted = (s: string) => [...s].sort().join('')
    expect(
      failing(
        everyPuzzle(anagram),
        (p) => p.display !== p.answer && sorted(p.display!) === sorted(p.answer),
      ),
    ).toEqual([])
  })
})

describe('sequence', () => {
  const numbers = (p: Generated) => p.display!.split(', ').map(Number)

  it('shows five whole numbers and asks for a sixth', () => {
    expect(
      failing(
        everyPuzzle(sequence),
        (p) =>
          numbers(p).length === 5 &&
          [...numbers(p), Number(p.answer)].every(
            (n) => Number.isInteger(n) && n > 0 && n < 10_000,
          ),
      ),
    ).toEqual([])
  })

  it('early on, the gap is always the same', () => {
    expect(
      failing(everyPuzzle(sequence, [0]), (p) => {
        const [a, b] = numbers(p)
        const step = b! - a!
        return [...numbers(p), Number(p.answer)].every((n, i) => n === a! + step * i)
      }),
    ).toEqual([])
  })
})

describe('riddle', () => {
  it('only asks riddles from the theme bank', () => {
    const questions = testTheme.riddles.map((r) => r.question)
    expect(failing(everyPuzzle(riddle), (p) => questions.includes(p.display!))).toEqual([])
  })
})
