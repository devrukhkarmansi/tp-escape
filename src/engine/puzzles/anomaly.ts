import type { PuzzleGenerator } from '../puzzle.ts'
import { createRng } from '../rng.ts'
import { band, flavor } from './shared.ts'

/** What marks the odd contact out. Later sweeps pick the harder tells. */
export const ANOMALY_TELLS = ['colour', 'size', 'still'] as const
export type AnomalyTell = (typeof ANOMALY_TELLS)[number]

const TELL_BY_STAGE: Record<number, AnomalyTell[]> = {
  0: ['colour'],
  1: ['size', 'colour'],
  2: ['still', 'size'],
}

const CONTACTS_BY_STAGE = [14, 20, 26] as const

const DESCRIPTION: Record<AnomalyTell, string> = {
  colour: 'One contact is a different colour from the rest.',
  size: 'One contact is a little smaller than the rest.',
  still: 'Every contact pulses. One does not.',
}

export type ScopeContact = { x: number; y: number; delay: number }
export type Scope = { contacts: ScopeContact[]; oddIndex: number }

/**
 * Lays out one sweep of the scope: contacts on a jittered grid, and which of them is the anomaly.
 * Seeded by the puzzle's code and the sweep number, so every phone in a crew sees the same field
 * and can point at it — and so a test can look at exactly what a player would see.
 */
export function sweepScope(code: string, sweep: number, count: number): Scope {
  const rng = createRng(Number(code) * 7919 + sweep * 104729)
  const columns = Math.ceil(Math.sqrt(count * 1.4))
  const rows = Math.ceil(count / columns)
  const cells = rng.shuffle(Array.from({ length: columns * rows }, (_, index) => index))

  const contacts = cells.slice(0, count).map((cell) => ({
    x: ((cell % columns) + 0.5 + (rng.next() - 0.5) * 0.5) * (100 / columns),
    y: (Math.floor(cell / columns) + 0.5 + (rng.next() - 0.5) * 0.5) * (100 / rows),
    delay: rng.next() * 1.6,
  }))
  return { contacts, oddIndex: rng.int(0, count - 1) }
}

/**
 * Anomaly sweep: a scope full of contacts, one of which is not like the others. Tap it and its
 * sector code closes the alert. No reading, no typing — just eyes.
 *
 * The field itself is laid out by the screen, a fresh one each sweep, so the engine only decides
 * how hard it is and what code the anomaly carries.
 */
export const anomaly: PuzzleGenerator = {
  kind: 'anomaly',
  generate(rng, { level, theme }) {
    const stage = band(level)
    const tell = rng.pick(TELL_BY_STAGE[stage]!)
    const contacts = CONTACTS_BY_STAGE[stage]!
    const code = String(rng.int(10, 99))
    const intro = flavor(rng, theme, 'anomaly', 'The long-range scope is full of contacts')

    // Early on the scope says what to look for; later the crew works it out.
    const told = stage === 0 ? ` ${DESCRIPTION[tell]}` : ''

    return {
      prompt: `${intro}. One contact is not like the others: tap it and the scope reads back its sector code.${told} Three wrong taps and the scope sweeps again.`,
      visual: { type: 'anomaly', tell, contacts, code },
      answer: code,
      hints: [
        'Look at the field as a whole rather than contact by contact; the odd one shows up when you stop staring.',
        DESCRIPTION[tell],
        `The sector code is ${code}, if the scope will not settle.`,
      ],
    }
  },
}
