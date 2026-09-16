import { describe, expect, it } from 'vitest'
import { newTestGame, splitNumberGenerator, START } from '../engine/test-fixtures.ts'
import type { Player } from '../store/crew.ts'
import { evidenceHolders, piecesFor } from './pieces.ts'

const game = newTestGame({ generators: [splitNumberGenerator('split')], splitPuzzles: true })
const splitIndex = game.systems.findIndex((s) => s.puzzle.pieces)

function player(id: string, joinedAt: number, lastSeen = START): Player {
  return { id, name: id.toUpperCase(), color: joinedAt, joinedAt, lastSeen, viewing: null }
}

describe('piecesFor', () => {
  it('is undefined for a system that is not split', () => {
    const plain = newTestGame()
    expect(piecesFor(plain, 0, 'ana')).toBeUndefined()
  })

  it('gives a solo player every piece', () => {
    expect(piecesFor(game, splitIndex, 'solo')!.every((p) => p.holder === null)).toBe(true)
  })

  it('shows each crewmate their own piece and names who holds the other', () => {
    const players = [player('ana', 1), player('ben', 2)]
    const ana = piecesFor(game, splitIndex, 'ana', players, START)!
    const ben = piecesFor(game, splitIndex, 'ben', players, START)!

    expect(ana.filter((p) => p.holder === null)).toHaveLength(1)
    expect(ben.filter((p) => p.holder === null)).toHaveLength(1)
    // Both phones agree who holds each piece.
    ana.forEach((piece, i) => {
      expect(piece.holder?.id ?? 'ana').toBe(ben[i]!.holder?.id ?? 'ben')
    })
  })

  it('hands a dropped player’s piece to whoever is still here', () => {
    const players = [player('ana', 1), player('ben', 2, START - 5 * 60_000)]
    expect(piecesFor(game, splitIndex, 'ana', players, START)!.every((p) => !p.holder)).toBe(true)
  })
})

describe('evidenceHolders', () => {
  it('is undefined in a solo game, where every card is yours', () => {
    expect(evidenceHolders(newTestGame(), 'solo')).toBeUndefined()
  })

  it('shares the cards out evenly and both phones agree', () => {
    const players = [player('ana', 1), player('ben', 2)]
    const ana = evidenceHolders(game, 'ana', players, START)!
    const ben = evidenceHolders(game, 'ben', players, START)!

    expect(ana).toHaveLength(game.mystery.evidence.length)
    const mine = ana.filter((holder) => holder === null).length
    expect(mine).toBe(Math.round(ana.length / 2))
    // Where Ana sees herself (null), Ben must name Ana, and the other way round.
    ana.forEach((holder, i) => {
      expect(holder?.id ?? 'ana').toBe(ben[i]?.id ?? 'ben')
    })
  })

  it('hands a dropped player’s cards to whoever is still here', () => {
    const players = [player('ana', 1), player('ben', 2, START - 5 * 60_000)]
    expect(evidenceHolders(game, 'ana', players, START)!.every((h) => h === null)).toBe(true)
  })
})
