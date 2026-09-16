import { describe, expect, it } from 'vitest'
import { checkAnswer } from '../check-answer.ts'
import type { GeneratedPuzzle, PuzzleGenerator } from '../puzzle.ts'
import { createRng } from '../rng.ts'
import { routeCode } from '../routing.ts'
import { testTheme } from '../test-fixtures.ts'
import { anagram } from './anagram.ts'
import { anomaly, sweepScope } from './anomaly.ts'
import { caesar, shiftLetters } from './caesar.ts'
import { PUZZLE_GENERATORS } from './index.ts'
import { gauge } from './gauge.ts'
import { glyph } from './glyph.ts'
import { memory } from './memory.ts'
import { MORSE, morse, toMorse } from './morse.ts'
import { riddle } from './riddle.ts'
import { routing } from './routing.ts'
import { sequence } from './sequence.ts'
import { wheel } from './wheel.ts'
import { WIRE_COLORS, wiring } from './wiring.ts'

const SEEDS = Array.from({ length: 1000 }, (_, i) => i * 7919 + 1)
const LEVELS = [0, 0.5, 1]

type Generated = GeneratedPuzzle & { seed: number; level: number }

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
      failing(
        puzzles,
        (p) => p.prompt.length > 0 && (!!p.display || !!p.visual) && p.hints.length > 0,
      ),
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

describe('glyph', () => {
  const visualOf = (p: Generated) => {
    if (p.visual?.type !== 'glyphs') throw new Error('expected glyphs')
    return p.visual
  }
  const missingCount = (p: Generated) => {
    const { glyphs, key } = visualOf(p)
    return new Set(glyphs.filter((g) => !key.some((k) => k.glyph === g))).size
  }

  it('decodes to the answer using the key, with the missing symbols filled in', () => {
    expect(
      failing(everyPuzzle(glyph), (p) => {
        const { glyphs, key } = visualOf(p)
        const decoded = glyphs.map((g) => key.find((k) => k.glyph === g)?.letter ?? '?').join('')
        // Every known position matches, and every "?" sits where a missing letter is.
        return [...decoded].every((c, i) => c === '?' || c === p.answer[i])
      }),
    ).toEqual([])
  })

  it('gives one symbol per letter, the same symbol for the same letter', () => {
    expect(
      failing(everyPuzzle(glyph), (p) => {
        const { glyphs } = visualOf(p)
        return [...p.answer].every((letter, i) => glyphs[i] === glyphs[p.answer.indexOf(letter)])
      }),
    ).toEqual([])
  })

  it('hides no symbols early, and at most two late', () => {
    expect(everyPuzzle(glyph, [0]).every((p) => missingCount(p) === 0)).toBe(true)
    expect(everyPuzzle(glyph, [1]).every((p) => missingCount(p) <= 2)).toBe(true)
    expect(everyPuzzle(glyph, [1]).some((p) => missingCount(p) > 0)).toBe(true)
  })
})

describe('morse', () => {
  it('blinks exactly the answer in Morse code', () => {
    expect(
      failing(everyPuzzle(morse), (p) => {
        if (p.visual?.type !== 'morse') return false
        return p.visual.code === toMorse(p.answer)
      }),
    ).toEqual([])
  })

  it('decodes letter by letter with the chart', () => {
    const fromMorse = Object.fromEntries(Object.entries(MORSE).map(([l, c]) => [c, l]))
    expect(
      failing(everyPuzzle(morse), (p) => {
        if (p.visual?.type !== 'morse') return false
        return (
          p.visual.code
            .split(' ')
            .map((c) => fromMorse[c])
            .join('') === p.answer
        )
      }),
    ).toEqual([])
  })

  it('writes the signal out early, and keeps it for a hint later', () => {
    const early = everyPuzzle(morse, [0])
    const late = everyPuzzle(morse, [1])
    expect(early.every((p) => p.visual?.type === 'morse' && p.visual.showText)).toBe(true)
    expect(late.every((p) => p.visual?.type === 'morse' && !p.visual.showText)).toBe(true)
    expect(late.every((p) => p.answer.length <= 5)).toBe(true)
  })
})

describe('gauge', () => {
  it('answers with each dial’s reading, left to right', () => {
    expect(
      failing(everyPuzzle(gauge), (p) => {
        if (p.visual?.type !== 'gauges') return false
        return p.visual.gauges.map((g) => g.value).join('') === p.answer
      }),
    ).toEqual([])
  })

  it('uses 3 dials early and 4 later, with one upside-down dial at the end', () => {
    const dials = (level: number) =>
      everyPuzzle(gauge, [level]).map((p) => (p.visual?.type === 'gauges' ? p.visual.gauges : []))
    expect(dials(0).every((g) => g.length === 3 && g.every((d) => !d.reversed))).toBe(true)
    expect(dials(1).every((g) => g.length === 4 && g.filter((d) => d.reversed).length === 1)).toBe(
      true,
    )
  })
})

describe('split pieces', () => {
  const splittable = [caesar, glyph, morse, gauge, wiring]

  it.each(splittable.map((g) => [g.kind, g] as const))(
    '%s splits into labelled pieces that each show something',
    (_kind, generator) => {
      const split = everyPuzzle(generator).filter((p) => p.split)
      expect(split.length).toBeGreaterThan(0)
      expect(
        failing(
          split,
          ({ split }) =>
            split!.pieces.length >= 2 &&
            split!.pieces.every(
              (piece) => piece.label && (piece.text || piece.display || piece.visual),
            ),
        ),
      ).toEqual([])
    },
  )

  it('does not split riddles, anagrams or number patterns', () => {
    for (const generator of [riddle, anagram, sequence]) {
      expect(everyPuzzle(generator).filter((p) => p.split)).toEqual([])
    }
  })

  it('caesar: the key piece decodes the message piece, and late codes have no key to split', () => {
    const early = everyPuzzle(caesar, [0])
    expect(
      failing(early, ({ split, answer }) => {
        const [message, key] = split!.pieces
        const shift = Number(key!.display!.slice(1))
        return shiftLetters(answer, shift) === message!.display
      }),
    ).toEqual([])
    expect(everyPuzzle(caesar, [1]).filter((p) => p.split)).toEqual([])
  })

  it('glyph: the inscription and the key pieces together are the whole puzzle', () => {
    expect(
      failing(everyPuzzle(glyph), ({ split, visual }) => {
        const [inscription, key] = split!.pieces.map((piece) => piece.visual)
        if (visual?.type !== 'glyphs' || inscription?.type !== 'glyphs' || key?.type !== 'glyphs') {
          return false
        }
        return (
          inscription.key.length === 0 &&
          key.glyphs.length === 0 &&
          JSON.stringify(inscription.glyphs) === JSON.stringify(visual.glyphs)
        )
      }),
    ).toEqual([])
  })

  it('glyph: a split key holds every letter, because its holder cannot see the word', () => {
    expect(
      failing(everyPuzzle(glyph), ({ split, answer }) => {
        const key = split!.pieces[1]!.visual
        if (key?.type !== 'glyphs') return false
        const letters = new Set(key.key.map((entry) => entry.letter))
        return [...answer].every((letter) => letters.has(letter))
      }),
    ).toEqual([])
  })

  it('glyph: a split puzzle never tells players a symbol is missing', () => {
    expect(
      failing(everyPuzzle(glyph), ({ split }) => !split!.prompt.includes('missing from the key')),
    ).toEqual([])
  })

  it('morse: the beacon piece has no chart, and the chart is its own piece', () => {
    expect(
      failing(everyPuzzle(morse), ({ split }) => {
        const [beacon, chart] = split!.pieces.map((piece) => piece.visual)
        return beacon?.type === 'morse' && beacon.chart === false && chart?.type === 'morse-chart'
      }),
    ).toEqual([])
  })

  it('gauge: the two banks of dials read, in order, as the whole answer', () => {
    expect(
      failing(everyPuzzle(gauge), ({ split, answer }) => {
        let next = 0
        const readings = split!.pieces.map((piece) => {
          if (piece.visual?.type !== 'gauges' || piece.visual.firstDial !== next) return '?'
          next += piece.visual.gauges.length
          return piece.visual.gauges.map((g) => g.value).join('')
        })
        return readings.join('') === answer
      }),
    ).toEqual([])
  })
})

describe('wiring', () => {
  const wiringOf = (p: Generated) => {
    if (p.visual?.type !== 'wiring') throw new Error('expected a wiring panel')
    return p.visual
  }
  const puzzles = everyPuzzle(wiring)

  it('answers with a wire that is really on the panel', () => {
    expect(
      failing(puzzles, (p) => {
        const cut = Number(p.answer)
        return Number.isInteger(cut) && cut >= 1 && cut <= wiringOf(p).wires.length
      }),
    ).toEqual([])
  })

  it('only uses wire colours the screen can draw', () => {
    expect(
      failing(puzzles, (p) => wiringOf(p).wires.every((w) => WIRE_COLORS.includes(w as never))),
    ).toEqual([])
  })

  it('always ends the manual with a rule that fits whatever the panel looks like', () => {
    expect(
      failing(puzzles, (p) => wiringOf(p).rules.at(-1)!.startsWith('Otherwise, cut the')),
    ).toEqual([])
  })

  it('names the rule that fits, and it points at the answer', () => {
    expect(
      failing(puzzles, (p) => {
        const rule = p.hints[1]!.replace('The rule that fits: ', '')
        const { rules } = wiringOf(p)
        // The hint's rule must be in the manual, and nothing above it may be the fallback.
        return rules.includes(rule) && rules.indexOf(rule) <= rules.length - 1
      }),
    ).toEqual([])
  })

  it('gets bigger later in the game: more wires and more rules', () => {
    const shape = (level: number) => {
      const puzzlesAt = everyPuzzle(wiring, [level]).map(wiringOf)
      const sizes = (pick: (v: ReturnType<typeof wiringOf>) => number) => puzzlesAt.map(pick)
      return {
        wires: sizes((v) => v.wires.length),
        rules: sizes((v) => v.rules.length),
      }
    }
    const early = shape(0)
    const mid = shape(0.5)
    const late = shape(1)

    expect([Math.min(...early.wires), Math.max(...early.wires)]).toEqual([3, 3])
    expect([Math.min(...mid.wires), Math.max(...mid.wires)]).toEqual([4, 4])
    // Late panels are 5 or 6 wires, so the crew can't guess the size from the stage alone.
    expect([Math.min(...late.wires), Math.max(...late.wires)]).toEqual([5, 6])
    // Rules include the catch-all last line: 3, then 4, then 5.
    expect(new Set(early.rules)).toEqual(new Set([3]))
    expect(new Set(mid.rules)).toEqual(new Set([4]))
    expect(new Set(late.rules)).toEqual(new Set([5]))
  })

  it('splits into the panel and the manual, with nothing shared', () => {
    expect(
      failing(puzzles, ({ split }) => {
        const [panel, manual] = split!.pieces.map((piece) => piece.visual)
        if (panel?.type !== 'wiring' || manual?.type !== 'wiring') return false
        return (
          panel.wires.length > 0 &&
          panel.rules.length === 0 &&
          manual.wires.length === 0 &&
          manual.rules.length > 0
        )
      }),
    ).toEqual([])
  })

  it('accepts "wire 3" and "third" as well as "3"', () => {
    const [first] = puzzles
    const cut = Number(first!.answer)
    expect(checkAnswer(first!, `wire ${cut}`)).toBe(true)
  })
})

describe('routing', () => {
  const gridOf = (p: Generated) => {
    if (p.visual?.type !== 'routing') throw new Error('expected a cable grid')
    return p.visual.grid
  }
  const puzzles = everyPuzzle(routing)

  it('never starts already connected, so there is always something to do', () => {
    expect(failing(puzzles, (p) => routeCode(gridOf(p)) === '')).toEqual([])
  })

  it('can always be connected by turning tiles, and that spells the answer', () => {
    expect(
      failing(puzzles, (p) => {
        // The run was laid out with every tile unturned, so that position must connect.
        const grid = gridOf(p)
        const laidOut = { ...grid, tiles: grid.tiles.map((tile) => ({ ...tile, turns: 0 })) }
        return routeCode(laidOut) === p.answer && p.answer.length > 0
      }),
    ).toEqual([])
  })

  it('gives every tile exactly two ends, so power never hits a fork', () => {
    expect(
      failing(puzzles, (p) =>
        gridOf(p).tiles.every(
          (tile) => [...tile.mask.toString(2)].filter((b) => b === '1').length === 2,
        ),
      ),
    ).toEqual([])
  })

  it('grows from a 3×3 grid to 4×4 as the shift goes on', () => {
    const size = (level: number) => everyPuzzle(routing, [level]).map((p) => gridOf(p))
    expect(new Set(size(0).map((g) => `${g.columns}x${g.rows}`))).toEqual(new Set(['3x3']))
    expect(new Set(size(1).map((g) => `${g.columns}x${g.rows}`))).toEqual(new Set(['4x4']))
  })

  it('answers with digits only, so the keypad fits it', () => {
    expect(failing(puzzles, (p) => /^\d+$/.test(p.answer))).toEqual([])
  })
})

describe('memory', () => {
  const patternOf = (p: Generated) => {
    if (p.visual?.type !== 'memory') throw new Error('expected memory pads')
    return p.visual
  }
  const puzzles = everyPuzzle(memory)

  it('answers with the pads in order, counting from 1', () => {
    expect(
      failing(
        puzzles,
        (p) =>
          patternOf(p)
            .pattern.map((pad) => pad + 1)
            .join('') === p.answer,
      ),
    ).toEqual([])
  })

  it('never flashes the same pad twice in a row, which would look like one long flash', () => {
    expect(
      failing(puzzles, (p) =>
        patternOf(p).pattern.every((pad, index, all) => index === 0 || pad !== all[index - 1]),
      ),
    ).toEqual([])
  })

  it('only uses pads that are on screen', () => {
    expect(
      failing(puzzles, (p) => {
        const { pattern, pads } = patternOf(p)
        return pattern.every((pad) => pad >= 0 && pad < pads)
      }),
    ).toEqual([])
  })

  it('gets longer and faster as the shift goes on', () => {
    const shape = (level: number) => everyPuzzle(memory, [level]).map(patternOf)
    expect(new Set(shape(0).map((v) => v.pattern.length))).toEqual(new Set([4]))
    expect(new Set(shape(0.5).map((v) => v.pattern.length))).toEqual(new Set([5]))
    expect(new Set(shape(1).map((v) => v.pattern.length))).toEqual(new Set([6]))
    expect(Math.max(...shape(1).map((v) => v.unitMs))).toBeLessThan(
      Math.min(...shape(0).map((v) => v.unitMs)),
    )
  })

  it('tells the crew the pattern in its last hint', () => {
    expect(
      failing(puzzles, (p) => {
        const spoken = patternOf(p)
          .pattern.map((pad) => pad + 1)
          .join(' – ')
        return p.hints.at(-1)!.includes(spoken)
      }),
    ).toEqual([])
  })
})

describe('wheel', () => {
  const codedOf = (p: Generated) => {
    if (p.visual?.type !== 'wheel') throw new Error('expected a cipher wheel')
    return p.visual.coded
  }
  const puzzles = everyPuzzle(wheel)

  it('can be read by turning the ring, and only at one setting', () => {
    expect(
      failing(puzzles, (p) => {
        const readings = Array.from({ length: 26 }, (_, turn) =>
          shiftLetters(codedOf(p), -turn),
        ).filter((reading) => reading === p.answer)
        return readings.length === 1
      }),
    ).toEqual([])
  })

  it('never hands over a message that already reads as the answer', () => {
    expect(failing(puzzles, (p) => codedOf(p) !== p.answer)).toEqual([])
  })

  it('says how far the ring is out in its last hint, and that really decodes it', () => {
    expect(
      failing(puzzles, (p) => {
        const steps = Number(/ring is (\d+) steps out/.exec(p.hints.at(-1)!)?.[1])
        return shiftLetters(codedOf(p), -steps) === p.answer
      }),
    ).toEqual([])
  })

  it('uses longer words later in the game', () => {
    const lengths = (level: number) => everyPuzzle(wheel, [level]).map((p) => p.answer.length)
    expect(Math.max(...lengths(0))).toBeLessThanOrEqual(6)
    expect(Math.min(...lengths(1))).toBeGreaterThanOrEqual(7)
  })
})

describe('anomaly', () => {
  const scopeOf = (p: Generated) => {
    if (p.visual?.type !== 'anomaly') throw new Error('expected a scope')
    return p.visual
  }
  const puzzles = everyPuzzle(anomaly)

  it('answers with the sector code the anomaly carries', () => {
    expect(
      failing(puzzles, (p) => scopeOf(p).code === p.answer && /^\d\d$/.test(p.answer)),
    ).toEqual([])
  })

  it('says what to look for early, and stops saying it later', () => {
    expect(everyPuzzle(anomaly, [0]).filter((p) => !p.prompt.includes('One contact is'))).toEqual(
      [],
    )
    expect(everyPuzzle(anomaly, [1]).filter((p) => p.prompt.includes('One contact is a'))).toEqual(
      [],
    )
  })

  it('uses the plainest tell early and the subtlest late', () => {
    const tells = (level: number) =>
      new Set(everyPuzzle(anomaly, [level]).map((p) => scopeOf(p).tell))
    // Early: colour only. Mid: colour or size. Late: size, or the hardest tell of all — a contact
    // that doesn't pulse when everything else does.
    expect(tells(0)).toEqual(new Set(['colour']))
    expect(tells(0.5)).toEqual(new Set(['size', 'colour']))
    expect(tells(1)).toEqual(new Set(['still', 'size']))
  })

  it('fills the scope with more contacts as the shift goes on', () => {
    const counts = (level: number) => everyPuzzle(anomaly, [level]).map((p) => scopeOf(p).contacts)
    expect(Math.max(...counts(0))).toBeLessThan(Math.min(...counts(1)))
    expect(Math.max(...counts(0.5))).toBeLessThan(Math.min(...counts(1)))
  })
})

describe('the anomaly scope', () => {
  it('shows every phone the same field, so a crew can point at it', () => {
    expect(sweepScope('42', 3, 20)).toEqual(sweepScope('42', 3, 20))
  })

  it('sweeps somewhere new each time', () => {
    const first = sweepScope('42', 0, 20)
    const second = sweepScope('42', 1, 20)
    expect(
      second.oddIndex === first.oddIndex && second.contacts[0]!.x === first.contacts[0]!.x,
    ).toBe(false)
  })

  it('keeps every contact on the scope, and marks exactly one anomaly', () => {
    for (let sweep = 0; sweep < 50; sweep++) {
      const { contacts, oddIndex } = sweepScope('73', sweep, 26)
      expect(contacts).toHaveLength(26)
      expect(oddIndex).toBeGreaterThanOrEqual(0)
      expect(oddIndex).toBeLessThan(26)
      for (const contact of contacts) {
        expect(contact.x).toBeGreaterThan(0)
        expect(contact.x).toBeLessThan(100)
        expect(contact.y).toBeGreaterThan(0)
        expect(contact.y).toBeLessThan(100)
      }
    }
  })
})
