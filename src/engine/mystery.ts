import { normalizeAnswer } from './check-answer.ts'
import type { Puzzle } from './puzzle.ts'
import { createRng } from './rng.ts'
import type { ThemePack } from './theme.ts'

export const FINALE_KIND = 'finale'
export const SUSPECT_COUNT = 3
const CODE_LENGTH = 4
// Its own random stream, so the mystery never shifts the puzzles (and vice versa).
const MYSTERY_SALT = 0x6c1d

export type EvidenceKind = 'alibi' | 'item' | 'place' | 'log'
export type EvidenceCard = { kind: EvidenceKind; text: string }

export type Mystery = {
  suspectIds: string[]
  culpritId: string
  item: string
  place: string
  /** One card per puzzle system, in board order. A card is revealed when its system is restored. */
  evidence: EvidenceCard[]
}

type PuzzleSystem = { name: string; answer: string }

const fill = (template: string, values: Record<string, string>) =>
  template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? `{${key}}`)

/** "keyboard" → "K", "22" → "2". What players read off the answer to build the launch code. */
export function firstCharacter(answer: string): string {
  return normalizeAnswer(answer).replace(/\s/g, '').charAt(0).toUpperCase()
}

/**
 * Builds this game's mystery: who did it, what they took, where it's hidden, one evidence card
 * per puzzle system, and the Escape Pod puzzle. The alibis always clear both innocent suspects,
 * so once every system is restored exactly one suspect is left.
 */
export function createMystery(
  seed: number,
  theme: ThemePack,
  systems: readonly PuzzleSystem[],
): { mystery: Mystery; finale: Omit<Puzzle, 'id'> } {
  const m = theme.mystery
  const count = systems.length
  const logsNeeded = count - (SUSPECT_COUNT - 1) - 2
  if (m.suspects.length < SUSPECT_COUNT) throw new Error(`Theme needs ${SUSPECT_COUNT} suspects`)
  if (m.logs.length < logsNeeded) throw new Error(`Theme needs ${logsNeeded} log lines`)
  if (m.alibis.length < SUSPECT_COUNT - 1) throw new Error('Theme needs more alibis')

  const rng = createRng(seed ^ MYSTERY_SALT)
  const suspects = rng.shuffle(m.suspects).slice(0, SUSPECT_COUNT)
  const culprit = rng.pick(suspects)
  const innocents = suspects.filter((s) => s !== culprit)
  const item = rng.pick(m.items)
  const place = rng.pick(m.places)

  const alibiTemplates = rng.shuffle(m.alibis)
  const alibis = innocents.map((suspect, i) => ({
    kind: 'alibi' as const,
    text: fill(alibiTemplates[i]!, { name: suspect.name }),
  }))
  const others: EvidenceCard[] = rng.shuffle([
    { kind: 'item', text: fill(rng.pick(m.itemClues), { item }) },
    { kind: 'place', text: fill(rng.pick(m.placeClues), { place }) },
    ...rng
      .shuffle(m.logs)
      .slice(0, logsNeeded)
      .map((template) => ({
        kind: 'log' as const,
        text: fill(template, { name: rng.pick(suspects).name }),
      })),
  ])

  // Alibis land in the second half of the board, so the answer builds up through the game.
  const secondHalf = Array.from(
    { length: count - Math.ceil(count / 2) },
    (_, i) => Math.ceil(count / 2) + i,
  )
  const alibiSlots = new Set(rng.shuffle(secondHalf).slice(0, alibis.length))
  const evidence: EvidenceCard[] = []
  let nextAlibi = 0
  let nextOther = 0
  for (let i = 0; i < count; i++) {
    evidence.push(alibiSlots.has(i) ? alibis[nextAlibi++]! : others[nextOther++]!)
  }

  // The launch code: first characters of answers from a few systems, in board order.
  const codeIndexes = rng
    .shuffle(systems.map((_, i) => i))
    .slice(0, Math.min(CODE_LENGTH, count))
    .sort((a, b) => a - b)
  const codeSystems = codeIndexes.map((i) => systems[i]!)
  const code = codeSystems.map((s) => firstCharacter(s.answer)).join('')
  const names = codeSystems.map((s) => s.name)
  const nameList = `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`

  return {
    mystery: {
      suspectIds: suspects.map((s) => s.id),
      culpritId: culprit.id,
      item,
      place,
      evidence,
    },
    finale: {
      kind: FINALE_KIND,
      prompt: `Name the traitor, then enter the launch code: the first character of each answer from ${nameList}, in that order.`,
      display: names.join('  ·  '),
      answer: code,
      hints: [
        'Two evidence cards each clear one suspect. The traitor is the one left.',
        `Open ${nameList} to read their answers. Take the first character of each.`,
        `The launch code starts with ${code.charAt(0)}.`,
      ],
    },
  }
}
