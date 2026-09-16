import { describe, expect, it } from 'vitest'
import { dealPieces, type Deal } from './deal.ts'

const SEATS = ['ana', 'ben', 'cai', 'dev']

function deal(overrides: Partial<Deal> = {}): string[] {
  return dealPieces({
    seed: 42,
    systemIndex: 0,
    pieceCount: 2,
    seats: SEATS,
    online: new Set(SEATS),
    ...overrides,
  })
}

describe('dealPieces', () => {
  it('gives every piece to a different player when there are enough players', () => {
    for (let systemIndex = 0; systemIndex < 20; systemIndex++) {
      const holders = deal({ systemIndex })
      expect(new Set(holders).size).toBe(2)
    }
  })

  it('gives the same deal on every phone', () => {
    expect(deal({ systemIndex: 3 })).toEqual(deal({ systemIndex: 3 }))
  })

  it('starts with different players on different systems', () => {
    const firstHolders = new Set(
      Array.from({ length: 20 }, (_, systemIndex) => deal({ systemIndex })[0]),
    )
    expect(firstHolders.size).toBeGreaterThan(1)
  })

  it('gives a player on their own every piece', () => {
    expect(deal({ seats: ['ana'], online: new Set(['ana']) })).toEqual(['ana', 'ana'])
  })

  it('moves only the pieces of a player who drops, and keeps the split', () => {
    for (let systemIndex = 0; systemIndex < 20; systemIndex++) {
      const before = deal({ systemIndex, seats: ['ana', 'ben', 'cai'] })
      const gone = before[0]!
      const online = new Set(['ana', 'ben', 'cai'].filter((id) => id !== gone))
      const after = deal({ systemIndex, seats: ['ana', 'ben', 'cai'], online })

      expect(after[1]).toBe(before[1])
      expect(after[0]).not.toBe(gone)
      expect(new Set(after).size).toBe(2)
    }
  })

  it('gives pieces back when the player reconnects', () => {
    const before = deal({ systemIndex: 5 })
    const without = new Set(SEATS.filter((id) => id !== before[0]))
    expect(deal({ systemIndex: 5, online: without })).not.toEqual(before)
    expect(deal({ systemIndex: 5 })).toEqual(before)
  })

  it('never loses a piece while anyone is connected', () => {
    for (let systemIndex = 0; systemIndex < 50; systemIndex++) {
      const holders = deal({ systemIndex, pieceCount: 3, online: new Set(['dev']) })
      expect(holders).toEqual(['dev', 'dev', 'dev'])
    }
  })

  it('shares pieces out evenly when players drop', () => {
    const holders = deal({ pieceCount: 2, seats: SEATS, online: new Set(['ana', 'dev']) })
    expect(new Set(holders)).toEqual(new Set(['ana', 'dev']))
  })
})
