import type { PuzzleGenerator } from '../puzzle.ts'
import type { Rng } from '../rng.ts'
import { band, flavor } from './shared.ts'

/** Wire colours. Names are shown as text too, so the puzzle never depends on colour alone. */
export const WIRE_COLORS = ['red', 'blue', 'yellow', 'white', 'green', 'purple'] as const
export type WireColor = (typeof WIRE_COLORS)[number]

/**
 * One line of the repair manual. Rules are read from the top; the first one that fits decides
 * which wire to cut. Every rule's instruction always points at a real wire when its "if" is true,
 * so the crew never falls through a rule that half-applies.
 */
export type WireRule = {
  text: string
  applies(wires: readonly WireColor[]): boolean
  cut(wires: readonly WireColor[]): number
}

const ordinal = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth'] as const
const count = (wires: readonly WireColor[], color: WireColor) =>
  wires.filter((w) => w === color).length
const lastIndexOf = (wires: readonly WireColor[], color: WireColor) => wires.lastIndexOf(color)

/** Rule shapes, each built from a colour (and sometimes a position) drawn from the puzzle's seed. */
function ruleOptions(rng: Rng, wires: readonly WireColor[]): WireRule[] {
  const color = () => rng.pick(WIRE_COLORS)
  const position = () => rng.int(0, wires.length - 1)

  const twoOfAColor = (c: WireColor): WireRule => ({
    text: `If there is more than one ${c} wire, cut the last ${c} wire.`,
    applies: (w) => count(w, c) > 1,
    cut: (w) => lastIndexOf(w, c),
  })
  const noneOfAColor = (c: WireColor, at: number): WireRule => ({
    text: `If there are no ${c} wires, cut the ${ordinal[at]} wire.`,
    applies: (w) => count(w, c) === 0,
    cut: () => at,
  })
  const exactlyOne = (c: WireColor): WireRule => ({
    text: `If exactly one wire is ${c}, cut that wire.`,
    applies: (w) => count(w, c) === 1,
    cut: (w) => w.indexOf(c),
  })
  const firstIs = (c: WireColor, at: number): WireRule => ({
    text: `If the first wire is ${c}, cut the ${ordinal[at]} wire.`,
    applies: (w) => w[0] === c,
    cut: () => at,
  })
  const lastIs = (c: WireColor): WireRule => ({
    text: `If the last wire is ${c}, cut the first wire.`,
    applies: (w) => w.at(-1) === c,
    cut: () => 0,
  })
  const evenCount = (): WireRule => ({
    text: 'If the panel has an even number of wires, cut the last wire.',
    applies: (w) => w.length % 2 === 0,
    cut: (w) => w.length - 1,
  })

  return [
    twoOfAColor(color()),
    noneOfAColor(color(), position()),
    exactlyOne(color()),
    firstIs(color(), position()),
    lastIs(color()),
    evenCount(),
  ]
}

const WIRES_BY_STAGE = [3, 4, 5] as const
const RULES_BY_STAGE = [2, 3, 4] as const

/**
 * Wiring panel: one player sees the wires, another has the repair manual. Read the manual from the
 * top and cut the first wire its rules point to. More wires and more rules later in the game.
 */
export const wiring: PuzzleGenerator = {
  kind: 'wiring',
  generate(rng, { level, theme }) {
    const stage = band(level)
    const wireCount = WIRES_BY_STAGE[stage]! + (stage === 2 ? rng.int(0, 1) : 0)
    const wires = Array.from({ length: wireCount }, () => rng.pick(WIRE_COLORS))

    // The last line always fits, so the manual always names exactly one wire to cut.
    const fallbackAt = rng.int(0, wireCount - 1)
    const fallback: WireRule = {
      text: `Otherwise, cut the ${ordinal[fallbackAt]} wire.`,
      applies: () => true,
      cut: () => fallbackAt,
    }
    const rules = [
      ...rng.shuffle(ruleOptions(rng, wires)).slice(0, RULES_BY_STAGE[stage]!),
      fallback,
    ]

    const matched = rules.find((rule) => rule.applies(wires))!
    const cutAt = matched.cut(wires)
    const intro = flavor(rng, theme, 'wiring', 'A wiring panel hangs open')

    return {
      prompt: `${intro}. Read the repair manual from the top and cut the first wire its rules point to. Enter that wire's number.`,
      visual: { type: 'wiring', wires, rules: rules.map((r) => r.text) },
      split: {
        prompt: `${intro}. One of you can see the wires, the other has the repair manual. Read the manual from the top and cut the first wire its rules point to.`,
        pieces: [
          { label: 'Wire panel', visual: { type: 'wiring', wires, rules: [] } },
          {
            label: 'Repair manual',
            visual: { type: 'wiring', wires: [], rules: rules.map((r) => r.text) },
          },
        ],
      },
      answer: String(cutAt + 1),
      altAnswers: [`wire ${cutAt + 1}`, ordinal[cutAt]!],
      hints: [
        'Read the manual from the top. The first rule that fits the panel is the one to follow; ignore the rest.',
        `The rule that fits: ${matched.text}`,
        `Cut the ${ordinal[cutAt]} wire, the ${wires[cutAt]} one.`,
      ],
    }
  },
}
