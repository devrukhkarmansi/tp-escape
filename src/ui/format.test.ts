import { describe, expect, it } from 'vitest'
import { describeClock, formatClock, formatPoints } from './format.ts'

describe('formatPoints', () => {
  it.each([
    [340, '+340'],
    [-40, '−40'],
    [0, '0'],
  ])('%i → %s', (points, expected) => {
    expect(formatPoints(points)).toBe(expected)
  })
})

describe('formatClock', () => {
  it.each([
    [1_024_000, '17:04'],
    [20 * 60_000, '20:00'],
    [59_000, '00:59'],
    [400, '00:01'],
    [0, '00:00'],
    [-5_000, '00:00'],
  ])('%i ms → %s', (ms, expected) => {
    expect(formatClock(ms)).toBe(expected)
  })
})

describe('describeClock', () => {
  it.each([
    [1_024_000, '17 minutes 4 seconds'],
    [60_000, '1 minute'],
    [1_000, '1 second'],
    [0, '0 seconds'],
  ])('%i ms → %s', (ms, expected) => {
    expect(describeClock(ms)).toBe(expected)
  })
})
