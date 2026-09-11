export type Rng = {
  /** Float in [0, 1). */
  next(): number
  /** Integer in [min, max], both ends inclusive. */
  int(min: number, max: number): number
  pick<T>(items: readonly T[]): T
}

// mulberry32: tiny and fast, fine for games, not for security.
// Every phone in a crew runs this with the same seed, so changing the algorithm
// changes every crew's puzzles. rng.test.ts pins its output to catch that.
export function createRng(seed: number): Rng {
  let state = seed | 0

  const next = () => {
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }

  return {
    next,
    int(min, max) {
      if (max < min) throw new Error(`int(${min}, ${max}): max must be >= min`)
      return min + Math.floor(next() * (max - min + 1))
    },
    pick(items) {
      if (items.length === 0) throw new Error('pick() needs at least one item')
      return items[Math.floor(next() * items.length)]!
    },
  }
}
