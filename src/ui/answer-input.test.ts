import { describe, expect, it } from 'vitest'
import type { Puzzle } from '../engine/puzzle.ts'
import { answerMode, tilesFor, usedTiles } from './answer-input.ts'

const puzzle = (fields: Partial<Puzzle>): Puzzle => ({
  id: 'p',
  kind: 'caesar',
  prompt: '',
  answer: 'REACTOR',
  hints: [],
  ...fields,
})

describe('answerMode', () => {
  it('offers a keypad for answers that are all digits', () => {
    expect(answerMode(puzzle({ kind: 'gauge', answer: '4071' }))).toBe('digits')
    expect(answerMode(puzzle({ kind: 'wiring', answer: '3' }))).toBe('digits')
  })

  it('offers the scrambled letters as tiles for an unscramble', () => {
    expect(answerMode(puzzle({ kind: 'anagram', answer: 'REACTOR', display: 'CATERRO' }))).toBe(
      'tiles',
    )
  })

  it('offers an A–Z pad for other one-word answers', () => {
    expect(answerMode(puzzle({ kind: 'glyph', answer: 'CIRCUIT' }))).toBe('letters')
    expect(answerMode(puzzle({ kind: 'morse', answer: 'MOON' }))).toBe('letters')
  })

  it('leaves the cipher wheel alone, since turning it fills the answer in', () => {
    expect(answerMode(puzzle({ kind: 'wheel', answer: 'HATCH' }))).toBe('text')
  })

  it('keeps the keyboard for riddles and anything with spaces', () => {
    expect(answerMode(puzzle({ kind: 'riddle', answer: 'towel' }))).toBe('text')
    expect(answerMode(puzzle({ kind: 'finale', answer: 'MOON DUST' }))).toBe('text')
  })
})

describe('tile pads', () => {
  it('offers the letters the puzzle shows, in the order it shows them', () => {
    expect(tilesFor(puzzle({ display: 'CATERRO' }))).toEqual(['C', 'A', 'T', 'E', 'R', 'R', 'O'])
  })

  it('uses up one tile per letter typed, so a doubled letter can be used twice', () => {
    const tiles = ['C', 'A', 'T', 'E', 'R', 'R', 'O']
    expect(usedTiles(tiles, '')).toEqual([false, false, false, false, false, false, false])
    // One R typed: the first R tile is spent, the second is still free.
    expect(usedTiles(tiles, 'R')).toEqual([false, false, false, false, true, false, false])
    expect(usedTiles(tiles, 'RR')).toEqual([false, false, false, false, true, true, false])
    expect(usedTiles(tiles, 'CAT')).toEqual([true, true, true, false, false, false, false])
  })
})
