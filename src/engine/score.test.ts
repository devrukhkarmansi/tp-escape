import { describe, expect, it } from 'vitest'
import { applyAction } from './game.ts'
import { scoreGame } from './score.ts'
import { difficulty, newTestGame, solve, solveEverything, START } from './test-fixtures.ts'

describe('scoreGame', () => {
  it('adds systems and time left, and subtracts hints, for a won game', () => {
    let game = newTestGame({ difficulty: difficulty('full') })
    game = applyAction(game, { type: 'hint', systemId: 'system-0', at: START + 1 })
    game = applyAction(game, { type: 'hint', systemId: 'system-0', at: START + 2 })
    // Finish with 7:04 (424 s) left: 424 / 3 = 141 time points.
    const won = solveEverything(game, game.endsAt - 424_000)

    expect(scoreGame(won)).toEqual({ systems: 800, time: 141, hints: -40, total: 901 })
  })

  it('gives no time bonus when time runs out', () => {
    let game = newTestGame()
    game = solve(game, 'system-0')
    game = solve(game, 'system-1')
    const lost = applyAction(game, { type: 'tick', at: game.endsAt })

    expect(scoreGame(lost)).toEqual({ systems: 200, time: 0, hints: 0, total: 200 })
  })

  it('never goes below zero', () => {
    let game = newTestGame()
    for (const systemId of ['system-0', 'system-1', 'system-2']) {
      game = applyAction(game, { type: 'hint', systemId, at: START + 1 })
      game = applyAction(game, { type: 'hint', systemId, at: START + 2 })
    }
    const lost = applyAction(game, { type: 'tick', at: game.endsAt })

    expect(scoreGame(lost)).toEqual({ systems: 0, time: 0, hints: -120, total: 0 })
  })
})
