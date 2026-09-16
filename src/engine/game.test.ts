import { describe, expect, it } from 'vitest'
import {
  alertLevel,
  applyAction,
  isPaused,
  MIN_OPEN_AT_ONCE,
  openAtOnceFor,
  timeLeftMs,
  type GameState,
} from './game.ts'
import type { PuzzleGenerator } from './puzzle.ts'
import { wiring } from './puzzles/wiring.ts'
import {
  difficulty,
  newTestGame,
  numberGenerator,
  solve,
  solveEverything,
  splitNumberGenerator,
  START,
  testTheme,
} from './test-fixtures.ts'

const MINUTE = 60_000

describe('createGame', () => {
  it('builds the same game from the same seed', () => {
    expect(newTestGame({ seed: 7 })).toEqual(newTestGame({ seed: 7 }))
  })

  it('builds a different game from a different seed', () => {
    const answers = (seed: number) => newTestGame({ seed }).systems.map((s) => s.puzzle.answer)
    expect(answers(1)).not.toEqual(answers(2))
  })

  it.each(['quick', 'full', 'deep'] as const)(
    '%s: one system per slot plus the Escape Pod, the first few open',
    (id) => {
      const tier = difficulty(id)
      const game = newTestGame({ difficulty: tier })
      expect(game.systems).toHaveLength(tier.systems + 1)
      expect(game.systems.filter((s) => s.status === 'open')).toHaveLength(MIN_OPEN_AT_ONCE)
      expect(new Set(game.systems.map((s) => s.name)).size).toBe(tier.systems + 1)
      expect(game.systems.at(-1)).toMatchObject({ name: 'Escape Pod', status: 'locked' })
      expect(game.endsAt - game.startedAt).toBe(tier.minutes * MINUTE)
    },
  )

  it('uses every puzzle type before repeating one', () => {
    const game = newTestGame({ difficulty: difficulty('quick') })
    const kinds = game.systems.map((s) => s.puzzle.kind)
    expect(new Set(kinds.slice(0, 3)).size).toBe(3)
  })

  it('ramps level from 0 on the first system to 1 on the last', () => {
    const levels: number[] = []
    const spy: PuzzleGenerator = {
      kind: 'spy',
      generate: (rng, { level }) => {
        levels.push(level)
        return numberGenerator('spy').generate(rng, { level, theme: testTheme })
      },
    }
    newTestGame({ generators: [spy], difficulty: difficulty('quick') })
    expect(levels).toEqual([0, 0.25, 0.5, 0.75, 1])
  })

  it("gives each puzzle its own seed, so one puzzle type can't shift another's puzzles", () => {
    const steady = numberGenerator('steady')
    const greedy = (draws: number): PuzzleGenerator => ({
      kind: 'greedy',
      generate: (rng, context) => {
        for (let i = 0; i < draws; i++) rng.next()
        return numberGenerator('greedy').generate(rng, context)
      },
    })
    const steadyAnswers = (draws: number) =>
      newTestGame({ generators: [steady, greedy(draws)], difficulty: difficulty('deep') })
        .systems.filter((s) => s.puzzle.kind === 'steady')
        .map((s) => s.puzzle.answer)

    expect(steadyAnswers(1)).toEqual(steadyAnswers(100))
  })

  it('never repeats an answer within a game', () => {
    const tiny: PuzzleGenerator = {
      kind: 'tiny',
      generate: (rng) => {
        const n = rng.int(1, 10)
        return { prompt: `Enter ${n}`, answer: String(n), hints: ['A number'] }
      },
    }
    for (let seed = 0; seed < 200; seed++) {
      const answers = newTestGame({ seed, generators: [tiny] }).systems.map((s) => s.puzzle.answer)
      expect(new Set(answers).size).toBe(answers.length)
    }
  })

  it('refuses a theme with too few systems for the shift', () => {
    const tiny = { ...testTheme, systemNames: ['Only one'] }
    expect(() => newTestGame({ theme: tiny })).toThrow(/needs 5/)
  })

  it('refuses to start with no puzzle types', () => {
    expect(() => newTestGame({ generators: [] })).toThrow()
  })
})

describe('how much of the board is open', () => {
  const openCount = (game: GameState) => game.systems.filter((s) => s.status === 'open').length

  it('gives a solo player or a pair three systems', () => {
    expect(openAtOnceFor(1, 8)).toBe(3)
    expect(openAtOnceFor(2, 8)).toBe(3)
    expect(openCount(newTestGame())).toBe(3)
  })

  it('opens one system per player in a bigger crew, so nobody is left watching', () => {
    expect(openAtOnceFor(4, 8)).toBe(4)
    expect(openAtOnceFor(6, 8)).toBe(6)
    expect(openCount(newTestGame({ crewSize: 4, difficulty: difficulty('full') }))).toBe(4)
    expect(openCount(newTestGame({ crewSize: 6, difficulty: difficulty('full') }))).toBe(6)
  })

  it('never opens more systems than the shift has', () => {
    expect(openAtOnceFor(6, 5)).toBe(5)
    const game = newTestGame({ crewSize: 6, difficulty: difficulty('quick') })
    expect(openCount(game)).toBe(5)
    // The Escape Pod still waits for every other system, however big the crew.
    expect(game.systems.at(-1)!.status).toBe('locked')
  })

  it('keeps the board just as open as systems are restored', () => {
    let game = newTestGame({ crewSize: 4, difficulty: difficulty('full') })
    game = solve(game, 'system-0')
    expect(openCount(game)).toBe(4)
    game = solve(game, 'system-1')
    expect(openCount(game)).toBe(4)
  })

  it('remembers the crew size in the game, so every phone agrees', () => {
    expect(newTestGame({ crewSize: 5, difficulty: difficulty('full') }).openAtOnce).toBe(5)
  })
})

describe('createGame: split puzzles', () => {
  const generators = [numberGenerator('plain'), splitNumberGenerator('split')]
  const splitSystems = (game: GameState) => game.systems.filter((s) => s.puzzle.pieces)

  it('never splits puzzles in a solo game', () => {
    expect(splitSystems(newTestGame({ generators }))).toEqual([])
    expect(newTestGame({ generators }).split).toBeUndefined()
  })

  it('marks a crew game, so the evidence is dealt out too', () => {
    expect(newTestGame({ generators, splitPuzzles: true }).split).toBe(true)
  })

  it.each([
    ['quick', 2],
    ['full', 3],
    ['deep', 4],
  ] as const)('splits about one system in three in a %s crew game', (id, expected) => {
    const game = newTestGame({
      generators: [splitNumberGenerator('split')],
      difficulty: difficulty(id),
      splitPuzzles: true,
    })
    expect(splitSystems(game)).toHaveLength(expected)
  })

  it('only splits puzzle types that can be split', () => {
    for (let seed = 0; seed < 50; seed++) {
      const game = newTestGame({ seed, generators, splitPuzzles: true })
      expect(splitSystems(game).every((s) => s.puzzle.kind === 'split')).toBe(true)
    }
  })

  it('shows the pieces instead of the whole puzzle, and keeps the answer', () => {
    const game = newTestGame({ generators, splitPuzzles: true })
    const [system] = splitSystems(game)
    expect(system!.puzzle).toMatchObject({ prompt: 'Put the two digits together' })
    expect(system!.puzzle.display).toBeUndefined()
    expect(system!.puzzle.pieces!.map((p) => p.display).join('')).toBe(system!.puzzle.answer)
    expect(game.systems.some((s) => 'split' in s.puzzle)).toBe(false)
  })

  it('does not change the puzzles themselves, only how they are shown', () => {
    const answers = (game: GameState) => game.systems.map((s) => s.puzzle.answer)
    for (let seed = 0; seed < 20; seed++) {
      expect(answers(newTestGame({ seed, generators, splitPuzzles: true }))).toEqual(
        answers(newTestGame({ seed, generators })),
      )
    }
  })
})

describe('applyAction: answers', () => {
  it('counts a wrong answer and keeps the system open', () => {
    const game = newTestGame()
    const next = applyAction(game, {
      type: 'submit',
      systemId: 'system-0',
      answer: 'definitely wrong',
      playerId: 'player-1',
      at: START + 1_000,
    })
    expect(next.systems[0]).toMatchObject({ status: 'open', wrongAttempts: 1 })
  })

  it('solves on the right answer, credits the player, and opens the next locked system', () => {
    const game = newTestGame()
    const next = solve(game, 'system-1', START + 5_000)
    expect(next.systems[1]).toMatchObject({
      status: 'solved',
      solvedBy: 'player-1',
      solvedAt: START + 5_000,
    })
    expect(next.systems[MIN_OPEN_AT_ONCE]!.status).toBe('open')
    expect(next.systems.filter((s) => s.status === 'open')).toHaveLength(MIN_OPEN_AT_ONCE)
  })

  it('ignores answers for locked or already-solved systems', () => {
    const game = newTestGame()
    const locked = game.systems.find((s) => s.status === 'locked')!
    expect(solve(game, locked.id)).toBe(game)

    const solvedOnce = solve(game, 'system-0')
    expect(solve(solvedOnce, 'system-0')).toBe(solvedOnce)
  })

  it('wins when the last system is solved', () => {
    const won = solveEverything(newTestGame(), START + 2 * MINUTE)
    expect(won.status).toBe('won')
    expect(won.endedAt).toBe(START + 2 * MINUTE)
    expect(won.systems.every((s) => s.status === 'solved')).toBe(true)
  })

  it('does nothing once the game is over', () => {
    const won = solveEverything(newTestGame())
    expect(applyAction(won, { type: 'tick', at: won.endsAt + 1 })).toBe(won)
  })
})

describe('applyAction: hints', () => {
  it('reveals hints one at a time, then stops', () => {
    let game = newTestGame()
    const hint = () => applyAction(game, { type: 'hint', systemId: 'system-0', at: START + 1 })
    game = hint()
    expect(game.systems[0]!.hintsUsed).toBe(1)
    game = hint()
    expect(game.systems[0]!.hintsUsed).toBe(2)
    expect(hint()).toBe(game)
  })

  it('gives no hints for locked systems', () => {
    const game = newTestGame()
    const locked = game.systems.find((s) => s.status === 'locked')!
    expect(applyAction(game, { type: 'hint', systemId: locked.id, at: START + 1 })).toBe(game)
  })
})

describe('applyAction: the clock', () => {
  it('a tick before time is up changes nothing', () => {
    const game = newTestGame()
    expect(applyAction(game, { type: 'tick', at: START + MINUTE })).toBe(game)
  })

  it('ends the game as lost when time runs out', () => {
    const game = newTestGame()
    const lost = applyAction(game, { type: 'tick', at: game.endsAt })
    expect(lost).toMatchObject({ status: 'lost', endedAt: game.endsAt })
  })

  it('rejects an answer that arrives after time is up', () => {
    const game = newTestGame()
    const late = solve(game, 'system-0', game.endsAt + 500)
    expect(late.status).toBe('lost')
    expect(late.systems[0]!.status).toBe('open')
  })
})

describe('applyAction: pause and resume', () => {
  const pauseAt = (game: GameState, at: number) => applyAction(game, { type: 'pause', at })
  const resumeAt = (game: GameState, at: number) => applyAction(game, { type: 'resume', at })

  // The default test game is a Quick Run: 6 minutes.
  it('freezes the clock while paused', () => {
    const paused = pauseAt(newTestGame(), START + 2 * MINUTE)
    expect(isPaused(paused)).toBe(true)
    expect(timeLeftMs(paused, START + 2 * MINUTE)).toBe(4 * MINUTE)
    expect(timeLeftMs(paused, START + 9 * MINUTE)).toBe(4 * MINUTE)
  })

  it('gives the paused time back on resume', () => {
    const game = newTestGame()
    const resumed = resumeAt(pauseAt(game, START + 2 * MINUTE), START + 7 * MINUTE)
    expect(isPaused(resumed)).toBe(false)
    expect(resumed.endsAt).toBe(game.endsAt + 5 * MINUTE)
    expect(timeLeftMs(resumed, START + 7 * MINUTE)).toBe(4 * MINUTE)
    expect('pausedAt' in resumed).toBe(false)
  })

  it('ignores answers, hints and ticks while paused, even past the original end time', () => {
    const paused = pauseAt(newTestGame(), START + MINUTE)
    expect(solve(paused, 'system-0', START + 2 * MINUTE)).toBe(paused)
    expect(applyAction(paused, { type: 'hint', systemId: 'system-0', at: START + 2 })).toBe(paused)
    expect(applyAction(paused, { type: 'tick', at: paused.endsAt + MINUTE })).toBe(paused)
  })

  it('ignores a second pause, and a resume when not paused', () => {
    const game = newTestGame()
    const paused = pauseAt(game, START + MINUTE)
    expect(pauseAt(paused, START + 2 * MINUTE)).toBe(paused)
    expect(resumeAt(game, START + MINUTE)).toBe(game)
  })

  it('cannot pause once time is up', () => {
    const game = newTestGame()
    expect(pauseAt(game, game.endsAt).status).toBe('lost')
  })

  it('keeps alert levels on the original shift length after a pause', () => {
    const game = newTestGame({ difficulty: difficulty('full') })
    const resumed = resumeAt(pauseAt(game, START + 4 * MINUTE), START + 30 * MINUTE)
    // 6 of 10 minutes left: still nominal, however long the pause was.
    expect(alertLevel(resumed, START + 30 * MINUTE)).toBe('nominal')
  })

  it('does not count paused time against the score', () => {
    const game = newTestGame()
    const resumed = resumeAt(pauseAt(game, START + MINUTE), START + 50 * MINUTE)
    const won = solveEverything(resumed, START + 51 * MINUTE)
    // 1 minute played before the pause, 1 after: 4 of 6 minutes left.
    expect(timeLeftMs(won, won.endedAt!)).toBe(4 * MINUTE)
  })
})

describe('timeLeftMs and alertLevel', () => {
  // Full Shift: 10 minutes.
  const game = newTestGame({ difficulty: difficulty('full') })

  it('counts down and never goes negative', () => {
    expect(timeLeftMs(game, START)).toBe(10 * MINUTE)
    expect(timeLeftMs(game, START + 3 * MINUTE)).toBe(7 * MINUTE)
    expect(timeLeftMs(game, game.endsAt + MINUTE)).toBe(0)
  })

  it('freezes when the game is won', () => {
    const won = solveEverything(game, START + 4 * MINUTE)
    expect(timeLeftMs(won, START + 9 * MINUTE)).toBe(6 * MINUTE)
  })

  it.each([
    [0, 'nominal'],
    [4, 'nominal'],
    [5, 'caution'],
    [7, 'caution'],
    [7.5, 'critical'],
  ] as const)('after %s of 10 minutes: %s', (minutesIn, level) => {
    expect(alertLevel(game, START + minutesIn * MINUTE)).toBe(level)
  })
})

describe('applyAction: the wiring panel is live', () => {
  const wiringGame = () =>
    newTestGame({ generators: [wiring], theme: { ...testTheme, flavor: {} } })

  it('ends the shift the moment the wrong wire is cut', () => {
    const game = wiringGame()
    const wrongWire = String(Number(game.systems[0]!.puzzle.answer) === 1 ? 2 : 1)
    const next = applyAction(game, {
      type: 'submit',
      systemId: 'system-0',
      answer: wrongWire,
      playerId: 'ana',
      at: START + 5_000,
    })

    expect(next.status).toBe('lost')
    expect(next.endedAt).toBe(START + 5_000)
    expect(next.blownSystemId).toBe('system-0')
    expect(next.systems[0]!.wrongAttempts).toBe(1)
  })

  it('leaves the shift running when the right wire is cut', () => {
    const game = wiringGame()
    const next = solve(game, 'system-0')
    expect(next.status).toBe('playing')
    expect(next.blownSystemId).toBeUndefined()
    expect(next.systems[0]!.status).toBe('solved')
  })

  it('does not end the shift for a wrong answer on any other puzzle type', () => {
    const next = applyAction(newTestGame(), {
      type: 'submit',
      systemId: 'system-0',
      answer: 'definitely wrong',
      playerId: 'ana',
      at: START + 1_000,
    })
    expect(next.status).toBe('playing')
  })
})
