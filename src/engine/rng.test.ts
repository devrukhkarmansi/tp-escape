import { describe, expect, it } from 'vitest'
import { createRng } from './rng.ts'

const draw = (seed: number, count: number) => {
  const rng = createRng(seed)
  return Array.from({ length: count }, () => rng.next())
}

describe('createRng', () => {
  it('produces the pinned sequence for seed 42', () => {
    // If this fails, the algorithm changed and every existing seed now makes different puzzles.
    expect(draw(42, 3)).toEqual([0.6011037519201636, 0.44829055899754167, 0.8524657934904099])
  })

  it('gives the same sequence for the same seed', () => {
    expect(draw(1234, 50)).toEqual(draw(1234, 50))
  })

  it('gives different sequences for different seeds', () => {
    expect(draw(1, 10)).not.toEqual(draw(2, 10))
  })

  it('keeps next() within [0, 1)', () => {
    for (const value of draw(7, 10_000)) {
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(1)
    }
  })

  it('keeps int() within inclusive bounds and reaches both ends', () => {
    const rng = createRng(99)
    const seen = new Set<number>()
    for (let i = 0; i < 2_000; i++) {
      const value = rng.int(3, 6)
      expect(Number.isInteger(value)).toBe(true)
      seen.add(value)
    }
    expect([...seen].sort()).toEqual([3, 4, 5, 6])
  })

  it('rejects an empty range', () => {
    expect(() => createRng(1).int(5, 4)).toThrow()
  })

  it('pick() only returns items from the list', () => {
    const rng = createRng(5)
    const items = ['airlock', 'reactor', 'nav'] as const
    for (let i = 0; i < 500; i++) {
      expect(items).toContain(rng.pick(items))
    }
  })

  it('pick() rejects an empty list', () => {
    expect(() => createRng(1).pick([])).toThrow()
  })
})
