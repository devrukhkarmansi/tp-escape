import { describe, expect, it } from 'vitest'
import { applyAction, isFinale, type GameState } from './game.ts'
import { scoreGame } from './score.ts'
import { difficulty, newTestGame, solve, solveEverything, START } from './test-fixtures.ts'

/** Restores every puzzle system, leaving the Escape Pod open. */
function readyForLaunch(game: GameState, at = START + 1_000): GameState {
  let current = game
  for (;;) {
    const open = current.systems.find((s) => s.status === 'open' && !isFinale(s))
    if (!open) return current
    current = solve(current, open.id, at)
  }
}

describe('scoreGame', () => {
  it('adds systems (and the Escape Pod) and time left, and subtracts hints, for a won game', () => {
    let game = newTestGame({ difficulty: difficulty('full') })
    game = applyAction(game, { type: 'hint', systemId: 'system-0', at: START + 1 })
    game = applyAction(game, { type: 'hint', systemId: 'system-0', at: START + 2 })
    // 8 systems + the Escape Pod. Finish with 7:04 (424 s) left: 424 / 3 = 141 time points.
    const won = solveEverything(game, game.endsAt - 424_000)

    expect(scoreGame(won)).toEqual({
      systems: 900,
      time: 141,
      hints: -40,
      accusations: 0,
      total: 1001,
    })
  })

  it('rounds seconds left up, the same way the clock shows them', () => {
    const game = newTestGame()
    // 311.4 s left shows as 05:12 on the clock, so it scores as 312 s: 104 points.
    const won = solveEverything(game, game.endsAt - 311_400)
    expect(scoreGame(won).time).toBe(104)
  })

  it('takes 50 points for each wrong accusation', () => {
    let game = readyForLaunch(newTestGame())
    const innocent = game.mystery.suspectIds.find((id) => id !== game.mystery.culpritId)!
    const escapePod = game.systems.find(isFinale)!
    game = applyAction(game, {
      type: 'accuse',
      suspectId: innocent,
      code: escapePod.puzzle.answer,
      playerId: 'player-1',
      at: START + 2_000,
    })
    const lost = applyAction(game, { type: 'tick', at: game.endsAt })

    expect(scoreGame(lost)).toMatchObject({ systems: 500, accusations: -50, total: 450 })
  })

  it('gives no time bonus when time runs out', () => {
    let game = newTestGame()
    game = solve(game, 'system-0')
    game = solve(game, 'system-1')
    const lost = applyAction(game, { type: 'tick', at: game.endsAt })

    expect(scoreGame(lost)).toEqual({ systems: 200, time: 0, hints: 0, accusations: 0, total: 200 })
  })

  it('never goes below zero', () => {
    let game = newTestGame()
    for (const systemId of ['system-0', 'system-1', 'system-2']) {
      game = applyAction(game, { type: 'hint', systemId, at: START + 1 })
      game = applyAction(game, { type: 'hint', systemId, at: START + 2 })
    }
    const lost = applyAction(game, { type: 'tick', at: game.endsAt })

    expect(scoreGame(lost)).toEqual({
      systems: 0,
      time: 0,
      hints: -120,
      accusations: 0,
      total: 0,
    })
  })
})
