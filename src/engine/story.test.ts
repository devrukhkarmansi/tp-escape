import { describe, expect, it } from 'vitest'
import { applyAction } from './game.ts'
import { beatsDue, endingFor, transmissionFor } from './story.ts'
import { newTestGame, solveEverything, START, testTheme } from './test-fixtures.ts'

const MINUTE = 60_000

describe('beatsDue', () => {
  // Quick Run: 6 minutes. Beats at 6:00, 4:30, 3:00 and 1:30 left.
  const game = newTestGame()

  it.each([
    [0, ['opening']],
    [1.4, ['opening']],
    [1.5, ['opening', 'newInfo']],
    [3, ['opening', 'newInfo', 'twist']],
    [4.5, ['opening', 'newInfo', 'twist', 'emergency']],
  ])('after %s of 6 minutes: %j', (minutesIn, expected) => {
    expect(beatsDue(game, START + minutesIn * MINUTE)).toEqual(expected)
  })

  it('stops while paused, like the clock', () => {
    const paused = applyAction(game, { type: 'pause', at: START + MINUTE })
    expect(beatsDue(paused, START + 5 * MINUTE)).toEqual(['opening'])
  })

  it('plays nothing once the game is over', () => {
    expect(beatsDue(solveEverything(game), START + 5 * MINUTE)).toEqual([])
  })
})

describe('which version plays', () => {
  it('is the same for the same game, so every phone in a crew sees the same message', () => {
    const a = newTestGame({ seed: 5 })
    const b = newTestGame({ seed: 5 })
    for (const beat of ['opening', 'newInfo', 'twist', 'emergency'] as const) {
      expect(transmissionFor(a, testTheme, beat)).toBe(transmissionFor(b, testTheme, beat))
    }
  })

  it('varies between games', () => {
    const twists = new Set(
      Array.from({ length: 50 }, (_, seed) =>
        transmissionFor(newTestGame({ seed }), testTheme, 'twist'),
      ),
    )
    expect(twists.size).toBe(testTheme.story.twist.length)
  })

  it('picks a winning or losing ending to match the result', () => {
    const won = solveEverything(newTestGame())
    const lost = applyAction(newTestGame(), { type: 'tick', at: newTestGame().endsAt })
    expect(testTheme.story.won).toContain(endingFor(won, testTheme))
    expect(testTheme.story.lost).toContain(endingFor(lost, testTheme))
  })
})
