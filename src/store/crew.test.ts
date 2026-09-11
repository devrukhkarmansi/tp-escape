import { describe, expect, it } from 'vitest'
import {
  CREW_CODE_ALPHABET,
  electHost,
  isCrewCode,
  isOnline,
  normalizeCrewCode,
  randomCrewCode,
  type Player,
} from './crew.ts'

const player = (id: string, joinedAt: number, lastSeen: number): Player => ({
  id,
  name: id,
  color: 0,
  joinedAt,
  lastSeen,
  viewing: null,
})

describe('crew codes', () => {
  it('uses 31 characters with no look-alikes', () => {
    expect(CREW_CODE_ALPHABET).toHaveLength(31)
    for (const lookAlike of ['0', 'O', '1', 'I', 'L']) {
      expect(CREW_CODE_ALPHABET).not.toContain(lookAlike)
    }
  })

  it('generates valid 5-character codes', () => {
    for (let i = 0; i < 1000; i++) expect(isCrewCode(randomCrewCode())).toBe(true)
  })

  it('matches the pattern the security rules enforce', () => {
    const rulesPattern = /^[2-9A-HJKMNP-Z]{5}$/
    for (let i = 0; i < 1000; i++) expect(randomCrewCode()).toMatch(rulesPattern)
    expect([...CREW_CODE_ALPHABET].every((c) => rulesPattern.test(c.repeat(5)))).toBe(true)
  })

  it('tidies up what people type', () => {
    expect(normalizeCrewCode(' k7q xm ')).toBe('K7QXM')
  })

  it('rejects codes that are the wrong length or use look-alikes', () => {
    expect(isCrewCode('K7QX')).toBe(false)
    expect(isCrewCode('K0QXM')).toBe(false)
    expect(isCrewCode('K7QXM')).toBe(true)
  })
})

describe('electHost', () => {
  const now = 1_000_000

  it('picks the earliest-joined player who is online', () => {
    const players = [player('late', 300, now), player('first', 100, now), player('mid', 200, now)]
    expect(electHost(players, now)).toBe('first')
  })

  it('passes host on when the first player goes offline', () => {
    const players = [player('first', 100, now - 120_000), player('second', 200, now)]
    expect(electHost(players, now)).toBe('second')
  })

  it('falls back to the earliest-joined if everyone is offline', () => {
    const players = [player('b', 200, 0), player('a', 100, 0)]
    expect(electHost(players, now)).toBe('a')
  })

  it('has no host with no players', () => {
    expect(electHost([], now)).toBeNull()
  })
})

describe('isOnline', () => {
  it('counts a player seen in the last minute as online', () => {
    expect(isOnline(player('p', 0, 1_000), 50_000)).toBe(true)
    expect(isOnline(player('p', 0, 1_000), 70_000)).toBe(false)
  })
})
