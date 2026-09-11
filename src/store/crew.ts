// Pure helpers for crews: codes, host election, presence. No Firebase here, so it's easy to test.

/** 31 characters with no look-alikes (no 0/O, 1/I/L). Must match isCrewCode in firestore.rules. */
export const CREW_CODE_ALPHABET = '23456789ABCDEFGHJKMNPQRSTUVWXYZ'
export const CREW_CODE_LENGTH = 5
export const MAX_CREW = 6

/** Seen within this long counts as online. Heartbeats go every 30 s, so one missed beat is fine. */
export const ONLINE_WINDOW_MS = 60_000

export type Player = {
  id: string
  name: string
  color: number
  joinedAt: number
  lastSeen: number
  viewing: string | null
}

export function randomCrewCode(random: () => number = Math.random): string {
  let code = ''
  for (let i = 0; i < CREW_CODE_LENGTH; i++) {
    code += CREW_CODE_ALPHABET[Math.floor(random() * CREW_CODE_ALPHABET.length)]
  }
  return code
}

/** What someone typed into "Join with code": " k7qxm " → "K7QXM". */
export function normalizeCrewCode(input: string): string {
  return input.replace(/\s+/g, '').toUpperCase()
}

export function isCrewCode(code: string): boolean {
  return code.length === CREW_CODE_LENGTH && [...code].every((c) => CREW_CODE_ALPHABET.includes(c))
}

export function isOnline(player: Player, now: number): boolean {
  return now - player.lastSeen < ONLINE_WINDOW_MS
}

/**
 * The host is never stored: it's the earliest-joined player who's online right now. If the host's
 * phone dies, the next person becomes host automatically, with no extra writes.
 */
export function electHost(players: readonly Player[], now: number): string | null {
  const online = players.filter((p) => isOnline(p, now))
  const pool = online.length > 0 ? online : players
  const [first] = [...pool].sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
  return first?.id ?? null
}
