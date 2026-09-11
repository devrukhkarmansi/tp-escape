import { describe, expect, it } from 'vitest'
import { applyAction, isFinale, type GameState } from './game.ts'
import { firstCharacter, SUSPECT_COUNT } from './mystery.ts'
import { difficulty, newTestGame, solve, START, testTheme } from './test-fixtures.ts'

const SEEDS = Array.from({ length: 500 }, (_, i) => i * 104_729 + 3)
const TIERS = ['quick', 'full', 'deep'] as const

const nameOf = (id: string) => testTheme.mystery.suspects.find((s) => s.id === id)!.name
const escapePodOf = (game: GameState) => game.systems.find(isFinale)!

function readyForLaunch(game: GameState): GameState {
  let current = game
  for (;;) {
    const open = current.systems.find((s) => s.status === 'open' && !isFinale(s))
    if (!open) return current
    current = solve(current, open.id)
  }
}

function accuse(game: GameState, suspectId: string, code: string): GameState {
  return applyAction(game, { type: 'accuse', suspectId, code, playerId: 'p1', at: START + 5_000 })
}

describe('the mystery', () => {
  it('is the same for the same seed, so every phone in a crew agrees', () => {
    expect(newTestGame({ seed: 9 }).mystery).toEqual(newTestGame({ seed: 9 }).mystery)
  })

  it('varies the culprit between games', () => {
    const culprits = new Set(SEEDS.map((seed) => newTestGame({ seed }).mystery.culpritId))
    expect(culprits.size).toBe(testTheme.mystery.suspects.length)
  })

  it.each(TIERS)(
    '%s: always leaves exactly one uncleared suspect, the culprit (500 seeds)',
    (tier) => {
      const unsolvable = SEEDS.filter((seed) => {
        const { mystery } = newTestGame({ seed, difficulty: difficulty(tier) })
        const alibis = mystery.evidence.filter((card) => card.kind === 'alibi')
        const uncleared = mystery.suspectIds.filter(
          (id) => !alibis.some((card) => card.text.includes(nameOf(id))),
        )
        return (
          mystery.suspectIds.length !== SUSPECT_COUNT ||
          alibis.length !== SUSPECT_COUNT - 1 ||
          uncleared.length !== 1 ||
          uncleared[0] !== mystery.culpritId
        )
      })
      expect(unsolvable).toEqual([])
    },
  )

  it.each(TIERS)('%s: one evidence card per puzzle system, alibis in the second half', (tier) => {
    for (const seed of SEEDS.slice(0, 100)) {
      const game = newTestGame({ seed, difficulty: difficulty(tier) })
      const puzzleSystems = game.systems.filter((s) => !isFinale(s))
      expect(game.mystery.evidence).toHaveLength(puzzleSystems.length)
      const firstAlibi = game.mystery.evidence.findIndex((card) => card.kind === 'alibi')
      expect(firstAlibi).toBeGreaterThanOrEqual(Math.ceil(puzzleSystems.length / 2))
      expect(game.mystery.evidence.filter((c) => c.kind === 'item')).toHaveLength(1)
      expect(game.mystery.evidence.filter((c) => c.kind === 'place')).toHaveLength(1)
      expect(game.mystery.evidence.every((c) => !c.text.includes('{'))).toBe(true)
    }
  })

  it('builds the launch code from the first character of the named systems’ answers', () => {
    for (const seed of SEEDS.slice(0, 100)) {
      const game = newTestGame({ seed })
      const pod = escapePodOf(game)
      const namesInCode = pod.puzzle.display!.split('  ·  ')
      const named = game.systems.filter((s) => !isFinale(s) && namesInCode.includes(s.name))
      expect(named).toHaveLength(4)
      expect(pod.puzzle.answer).toBe(named.map((s) => firstCharacter(s.puzzle.answer)).join(''))
    }
  })
})

describe('the Escape Pod', () => {
  it('stays locked until every other system is restored', () => {
    let game = newTestGame()
    const puzzleCount = game.systems.length - 1
    for (let solved = 0; solved < puzzleCount; solved++) {
      expect(escapePodOf(game).status).toBe('locked')
      const open = game.systems.find((s) => s.status === 'open' && !isFinale(s))!
      game = solve(game, open.id)
    }
    expect(escapePodOf(game).status).toBe('open')
    expect(game.status).toBe('playing')
  })

  it("can't be solved by typing an answer; it needs an accusation", () => {
    const game = readyForLaunch(newTestGame())
    const pod = escapePodOf(game)
    const typed = applyAction(game, {
      type: 'submit',
      systemId: pod.id,
      answer: pod.puzzle.answer,
      playerId: 'p1',
      at: START + 5_000,
    })
    expect(typed).toBe(game)
  })

  it('launches with the right suspect and code, and the crew wins', () => {
    const game = readyForLaunch(newTestGame())
    const won = accuse(game, game.mystery.culpritId, escapePodOf(game).puzzle.answer.toLowerCase())
    expect(won.status).toBe('won')
    expect(escapePodOf(won)).toMatchObject({ status: 'solved', solvedBy: 'p1' })
  })

  it('refuses the wrong suspect, or the wrong code, and counts the attempt', () => {
    const game = readyForLaunch(newTestGame())
    const code = escapePodOf(game).puzzle.answer
    const innocent = game.mystery.suspectIds.find((id) => id !== game.mystery.culpritId)!

    const wrongSuspect = accuse(game, innocent, code)
    expect(wrongSuspect.status).toBe('playing')
    expect(escapePodOf(wrongSuspect).wrongAttempts).toBe(1)

    const wrongCode = accuse(wrongSuspect, game.mystery.culpritId, 'ZZZZ')
    expect(escapePodOf(wrongCode).wrongAttempts).toBe(2)
  })

  it('ignores accusations before it opens', () => {
    const game = newTestGame()
    expect(accuse(game, game.mystery.culpritId, escapePodOf(game).puzzle.answer)).toBe(game)
  })
})
