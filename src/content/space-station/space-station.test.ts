import { describe, expect, it } from 'vitest'
import { checkAnswer, normalizeAnswer } from '../../engine/check-answer.ts'
import { DIFFICULTIES } from '../../engine/difficulty.ts'
import { createGame, isFinale } from '../../engine/game.ts'
import { PUZZLE_GENERATORS } from '../../engine/puzzles/index.ts'
import { solveEverything, START } from '../../engine/test-fixtures.ts'
import { spaceStation } from './index.ts'

const longestShift = Math.max(...DIFFICULTIES.map((d) => d.systems))

describe('space station content', () => {
  it('has enough distinct systems for the longest shift, and keeps Escape Pod for the finale', () => {
    const names = spaceStation.systemNames
    expect(new Set(names).size).toBe(names.length)
    expect(names.length).toBeGreaterThanOrEqual(longestShift)
    expect(names).not.toContain('Escape Pod')
  })

  it('has clean words: capitals only, 4–9 letters, no duplicates', () => {
    const bad = spaceStation.words.filter((w) => !/^[A-Z]{4,9}$/.test(w))
    expect(bad).toEqual([])
    expect(new Set(spaceStation.words).size).toBe(spaceStation.words.length)
  })

  it('has no two words that are anagrams of each other, so an unscramble has one answer', () => {
    const byLetters = new Map<string, string[]>()
    for (const word of spaceStation.words) {
      const key = [...word].sort().join('')
      byLetters.set(key, [...(byLetters.get(key) ?? []), word])
    }
    expect([...byLetters.values()].filter((group) => group.length > 1)).toEqual([])
  })

  it('has at least 3 words for every word length a game asks for', () => {
    for (const min of [4, 5, 6, 7]) {
      const fitting = spaceStation.words.filter((w) => w.length >= min && w.length <= min + 2)
      expect(fitting.length, `words of ${min}–${min + 2} letters`).toBeGreaterThanOrEqual(3)
    }
  })

  it('has riddles with distinct answers, each accepted by the checker, each with 2 hints', () => {
    const riddles = spaceStation.riddles
    expect(riddles.length).toBeGreaterThanOrEqual(12)
    expect(new Set(riddles.map((r) => normalizeAnswer(r.answer))).size).toBe(riddles.length)
    for (const r of riddles) {
      expect(checkAnswer(r, r.answer), r.question).toBe(true)
      expect(r.hints.length, r.question).toBeGreaterThanOrEqual(2)
    }
  })

  it('has flavor text for every puzzle type', () => {
    for (const { kind } of PUZZLE_GENERATORS) {
      expect(spaceStation.flavor[kind]?.length, kind).toBeGreaterThan(0)
    }
  })

  it('has 3 versions of every story moment, so replays read differently', () => {
    const { story } = spaceStation
    for (const beat of ['opening', 'newInfo', 'twist', 'emergency'] as const) {
      expect(story[beat], beat).toHaveLength(3)
    }
    expect(story.won).toHaveLength(3)
    expect(story.lost).toHaveLength(3)
  })

  it('keeps transmissions short enough to read on a phone mid-puzzle', () => {
    const { story } = spaceStation
    const transmissions = [...story.opening, ...story.newInfo, ...story.twist, ...story.emergency]
    for (const t of transmissions) {
      expect(t.lines.length, t.from).toBeLessThanOrEqual(3)
      for (const line of t.lines) expect(line.length, line).toBeLessThanOrEqual(110)
    }
  })

  it('only uses the {time} placeholder in openings, where the shift length is known', () => {
    const { story } = spaceStation
    for (const t of [...story.newInfo, ...story.twist, ...story.emergency]) {
      expect(t.lines.join(' ')).not.toContain('{time}')
    }
    for (const t of story.opening) expect(t.lines.join(' ')).toContain('{time}')
  })

  it('has enough mystery text for the longest shift', () => {
    const { mystery } = spaceStation
    expect(new Set(mystery.suspects.map((s) => s.id)).size).toBe(mystery.suspects.length)
    expect(mystery.suspects.length).toBeGreaterThanOrEqual(3)
    // Every puzzle system reveals a card: 2 alibis, 1 item, 1 place, the rest logs.
    expect(mystery.logs.length).toBeGreaterThanOrEqual(longestShift - 4)
    expect(mystery.alibis.length).toBeGreaterThanOrEqual(2)
  })

  it('fills in the right blanks in each kind of clue', () => {
    const { mystery } = spaceStation
    for (const t of mystery.alibis) expect(t).toContain('{name}')
    for (const t of mystery.itemClues) expect(t).toContain('{item}')
    for (const t of mystery.placeClues) expect(t).toContain('{place}')
  })

  it('never lets a log line sound like an alibi, since only alibis may clear someone', () => {
    for (const log of spaceStation.mystery.logs) {
      expect(log).not.toMatch(/cleared|could not have|couldn't have|asleep|all night/i)
    }
  })
})

describe.each(DIFFICULTIES.map((d) => [d.name, d] as const))(
  'full %s games with the real puzzles',
  (_name, difficulty) => {
    const games = Array.from({ length: 1000 }, (_, seed) =>
      createGame({
        seed,
        difficulty,
        theme: spaceStation,
        generators: PUZZLE_GENERATORS,
        startedAt: START,
      }),
    )

    it('never repeats an answer within a game, across 1,000 seeds', () => {
      const repeats = games.filter((game) => {
        const answers = game.systems
          .filter((s) => !isFinale(s))
          .map((s) => normalizeAnswer(s.puzzle.answer))
        return new Set(answers).size !== answers.length
      })
      expect(repeats.map((g) => g.seed)).toEqual([])
    })

    it('can be won by answering every puzzle correctly, across 1,000 seeds', () => {
      const unwinnable = games.filter((game) => solveEverything(game).status !== 'won')
      expect(unwinnable.map((g) => g.seed)).toEqual([])
    })
  },
)
