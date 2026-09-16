import type { PuzzleGenerator } from '../puzzle.ts'
import { createRng, type Rng } from '../rng.ts'
import { band, flavor } from './shared.ts'

/** What a contact on the scope looks like. The plain value first, the odd one second. */
export const CONTACT_TRAITS = {
  colour: ['teal', 'amber'],
  size: ['normal', 'small'],
  pulse: ['pulsing', 'steady'],
} as const

export type Trait = keyof typeof CONTACT_TRAITS
export type Contact = { colour: string; size: string; pulse: string }

/** The two odd traits that together mark the faulty contact. Everything else is a decoy. */
export type FaultSignature = { traits: Trait[]; reads: string }

const ODD = { colour: 'amber', size: 'small', pulse: 'steady' } as const
const PLAIN: Contact = { colour: 'teal', size: 'normal', pulse: 'pulsing' }

const READS: Record<Trait, string> = {
  colour: 'amber',
  size: 'small',
  pulse: 'steady (not pulsing)',
}

export type ScopeRound = {
  contacts: Contact[]
  /** The one contact carrying both odd traits. */
  faultIndex: number
  /** What tapping it reads back: one digit of the sector code. */
  digit: number
}

/**
 * One round of the scope: one contact carries both odd traits, and plenty of others carry just
 * one, so the fault can only be found by holding both halves of the report together.
 */
function buildRound(rng: Rng, count: number, traits: Trait[], digit: number): ScopeRound {
  const contacts: Contact[] = Array.from({ length: count }, () => ({ ...PLAIN }))
  const order = rng.shuffle(Array.from({ length: count }, (_, index) => index))
  const faultIndex = order[0]!

  const fault = contacts[faultIndex]!
  for (const trait of traits) fault[trait] = ODD[trait]

  // Decoys: about a third of the scope carries one odd trait each, including the trait the report
  // does not care about, so "the odd-looking one" is never the answer.
  const decoys = order.slice(1, 1 + Math.max(4, Math.round(count / 3)))
  const spread = [...traits, ...(Object.keys(ODD) as Trait[]).filter((t) => !traits.includes(t))]
  decoys.forEach((index, n) => {
    const trait = spread[n % spread.length]!
    contacts[index]![trait] = ODD[trait]
  })

  return { contacts, faultIndex, digit }
}

const SHAPE = [
  { contacts: 14, rounds: 2 },
  { contacts: 20, rounds: 2 },
  { contacts: 24, rounds: 3 },
] as const

/**
 * Anomaly sweep: a scope full of contacts and a fault report that says which two things mark the
 * faulty one. In a crew the two are on different screens, so the scope holder has to describe what
 * they see and be told which combination counts. Each round found reads back one digit of the code.
 */
export const anomaly: PuzzleGenerator = {
  kind: 'anomaly',
  generate(rng, { level, theme }) {
    const { contacts, rounds } = SHAPE[band(level)]!
    const traits = rng.shuffle(Object.keys(CONTACT_TRAITS) as Trait[]).slice(0, 2)
    const signature: FaultSignature = {
      traits,
      reads: traits.map((trait) => READS[trait]).join(' and '),
    }

    const scope = Array.from({ length: rounds }, () => rng.int(0, 9)).map((digit) =>
      buildRound(rng, contacts, traits, digit),
    )
    const code = scope.map((round) => round.digit).join('')
    const intro = flavor(rng, theme, 'anomaly', 'The long-range scope is full of contacts')

    const prompt = `${intro}. Only one contact matches the fault report. Tap it and the scope reads back a digit; find all ${rounds} and you have the sector code.`
    return {
      prompt,
      visual: { type: 'anomaly', scope, signature },
      split: {
        prompt: `${prompt} One of you has the scope, the other the fault report.`,
        pieces: [
          { label: 'Scope', visual: { type: 'anomaly', scope } },
          {
            label: 'Fault report',
            text: `Fault signature: ${signature.reads}. Contacts matching only one of those are debris — ignore them.`,
          },
        ],
      },
      answer: code,
      hints: [
        'A contact has to match both halves of the report. Plenty match one; only one matches both.',
        `The fault reads as ${signature.reads}.`,
        `The sector code is ${code}.`,
      ],
    }
  },
}

/** Where each contact sits, seeded so every phone lays the scope out the same way. */
export function scopeLayout(code: string, round: number, count: number) {
  const rng = createRng(Number(code) * 7919 + round * 104729)
  const columns = Math.ceil(Math.sqrt(count * 1.4))
  const rows = Math.ceil(count / columns)
  const cells = rng.shuffle(Array.from({ length: columns * rows }, (_, index) => index))

  return cells.slice(0, count).map((cell) => ({
    x: ((cell % columns) + 0.5 + (rng.next() - 0.5) * 0.5) * (100 / columns),
    y: (Math.floor(cell / columns) + 0.5 + (rng.next() - 0.5) * 0.5) * (100 / rows),
    delay: rng.next() * 1.6,
  }))
}
