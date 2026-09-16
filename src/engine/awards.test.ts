import { describe, expect, it } from 'vitest'
import { awardsFor } from './awards.ts'
import { applyAction, isFinale, type GameState } from './game.ts'
import {
  launchEscapePod,
  newTestGame,
  solve,
  solveEverything,
  splitNumberGenerator,
  START,
} from './test-fixtures.ts'

const ids = (state: GameState, crewSize = 1) => awardsFor(state, crewSize).map((a) => a.id)

/** Solves a system as a named player, so award tests read like a real crew. */
function solveAs(state: GameState, systemId: string, playerId: string, at = START + 1_000) {
  const system = state.systems.find((s) => s.id === systemId)!
  return applyAction(state, {
    type: 'submit',
    systemId,
    answer: system.puzzle.answer,
    playerId,
    at,
  })
}

describe('awardsFor', () => {
  it('gives no crew awards in a solo game', () => {
    const game = solveEverything(newTestGame())
    expect(ids(game)).not.toContain('mastermind')
    expect(ids(game)).not.toContain('comms')
  })

  it('names the player who restored the most systems', () => {
    let game = newTestGame()
    game = solveAs(game, 'system-0', 'ana')
    game = solveAs(game, 'system-1', 'ana')
    game = solveAs(game, 'system-2', 'ben')
    const mastermind = awardsFor(game, 2).find((a) => a.id === 'mastermind')
    expect(mastermind?.playerId).toBe('ana')
  })

  it('gives nobody the award when two players tie', () => {
    let game = newTestGame()
    game = solveAs(game, 'system-0', 'ana')
    game = solveAs(game, 'system-1', 'ben')
    expect(ids(game, 2)).not.toContain('mastermind')
  })

  it('gives Comms MVP for split systems, which need two screens', () => {
    let game = newTestGame({ generators: [splitNumberGenerator('split')], splitPuzzles: true })
    // Ben takes every split system, Ana the rest. The Escape Pod is left alone: it takes an
    // accusation rather than an answer, and it is never split.
    for (;;) {
      const open = game.systems.find((s) => s.status === 'open' && !isFinale(s))
      if (!open) break
      game = solveAs(game, open.id, open.puzzle.pieces ? 'ben' : 'ana')
    }
    const comms = awardsFor(game, 2).find((a) => a.id === 'comms')
    expect(comms?.playerId).toBe('ben')
  })

  it('gives Clutch for a solve in the final minute, and names the system', () => {
    const game = solve(newTestGame(), 'system-0', START + 5 * 60_000 + 30_000)
    const clutch = awardsFor(game).find((a) => a.id === 'clutch')
    expect(clutch?.description).toContain(game.systems[0]!.name)
  })

  it('gives no Clutch when the last solve was early', () => {
    expect(ids(solve(newTestGame(), 'system-0', START + 1_000))).not.toContain('clutch')
  })

  it('gives No Hints Needed only when the crew used none', () => {
    const clean = solve(newTestGame(), 'system-0')
    expect(ids(clean)).toContain('unaided')

    const helped = applyAction(clean, { type: 'hint', systemId: 'system-1', at: START + 2_000 })
    expect(ids(helped)).not.toContain('unaided')
  })

  it('gives Eagle Eye for naming the traitor first time, but not after a wrong guess', () => {
    const won = solveEverything(newTestGame())
    expect(ids(won)).toContain('eagle-eye')

    let game = newTestGame()
    for (const system of game.systems.filter((s) => !isFinale(s))) {
      game = solve(game, system.id)
    }
    const wrongFirst = applyAction(game, {
      type: 'accuse',
      suspectId: 'nobody',
      code: 'wrong',
      playerId: 'ana',
      at: START + 2_000,
    })
    expect(ids(launchEscapePod(wrongFirst, START + 3_000))).not.toContain('eagle-eye')
  })

  it('gives Early Shift only when plenty of time was left', () => {
    expect(ids(solveEverything(newTestGame(), START + 60_000))).toContain('early-shift')
    expect(ids(solveEverything(newTestGame(), START + 5 * 60_000 + 30_000))).not.toContain(
      'early-shift',
    )
  })

  it('is the same on every phone, because it only reads the finished game', () => {
    const game = solveEverything(newTestGame())
    expect(awardsFor(game, 3)).toEqual(awardsFor(game, 3))
  })
})
