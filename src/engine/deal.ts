import { createRng } from './rng.ts'

const DEAL_SALT = 0x5ea7

export type Deal = {
  seed: number
  /** Board position of the system, so different systems start with different players. */
  systemIndex: number
  pieceCount: number
  /** Everyone in the crew, in join order, online or not. */
  seats: readonly string[]
  /** Who is connected right now. This device always counts itself, so it never loses a piece. */
  online: ReadonlySet<string>
}

/**
 * Who holds each piece of a split puzzle, as one player id per piece. Every phone runs this with
 * the same inputs, so every phone agrees without storing anything.
 *
 * Pieces go round the seats from a starting seat picked by the seed. A piece whose seat is offline
 * moves to the connected player holding the fewest pieces of this puzzle, so everyone else keeps
 * what they have, and the piece goes back when its player reconnects.
 */
export function dealPieces({ seed, systemIndex, pieceCount, seats, online }: Deal): string[] {
  const connected = seats.filter((id) => online.has(id))
  if (connected.length === 0) return []

  const start = createRng((seed ^ DEAL_SALT) + systemIndex).int(0, seats.length - 1)
  const holders = Array.from({ length: pieceCount }, (_, i) => seats[(start + i) % seats.length]!)

  const held = new Map(connected.map((id) => [id, holders.filter((h) => h === id).length]))
  // Ties go to the next connected seat after the starting one, the same order the deal used.
  const byTurn = connected.map((_, i) => connected[(start + i) % connected.length]!)

  return holders.map((holder) => {
    if (online.has(holder)) return holder
    const [fewest] = [...byTurn].sort((a, b) => held.get(a)! - held.get(b)!)
    held.set(fewest!, held.get(fewest!)! + 1)
    return fewest!
  })
}
