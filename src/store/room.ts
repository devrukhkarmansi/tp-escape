// Everything that reads or writes a crew's room in Firestore. See docs/multiplayer.md.
import {
  collection,
  doc,
  getDocFromServer,
  increment,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore'
import type { DifficultyId } from '../engine/difficulty.ts'
import { applyAction, type GameAction, type GameState } from '../engine/game.ts'
import { firebase, signIn } from '../firebase/app.ts'
import { MAX_CREW, randomCrewCode, type Player } from './crew.ts'

export type Room = {
  code: string
  difficultyId: DifficultyId
  playerUids: string[]
  status: 'lobby' | 'playing'
  game: GameState | null
  round: number
}

const roomRef = (code: string) => doc(firebase().db, 'rooms', code)
const playerRef = (code: string, uid: string) => doc(firebase().db, 'rooms', code, 'players', uid)

function newPlayer(name: string, color: number) {
  return {
    name,
    color,
    joinedAt: serverTimestamp(),
    lastSeen: serverTimestamp(),
    viewing: null,
  }
}

/** Creates a room with you as its only player, and returns its crew code. */
export async function createCrew(name: string, difficultyId: DifficultyId): Promise<string> {
  const uid = await signIn()
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = randomCrewCode()
    // The transaction only creates the room if the code is free, so two crews can't share one.
    const created = await runTransaction(firebase().db, async (tx) => {
      if ((await tx.get(roomRef(code))).exists()) return false
      tx.set(roomRef(code), {
        code,
        difficultyId,
        playerUids: [uid],
        status: 'lobby',
        game: null,
        round: 0,
        createdAt: serverTimestamp(),
      })
      tx.set(playerRef(code, uid), newPlayer(name, 0))
      return true
    })
    if (created) return code
  }
  throw new Error('Could not find a free crew code. Please try again.')
}

export type JoinResult = 'joined' | 'full' | 'missing'

/** Adds you to a crew (or just updates your name if you're already in it). */
export async function joinCrew(code: string, name: string): Promise<JoinResult> {
  const uid = await signIn()
  return runTransaction(firebase().db, async (tx) => {
    const snapshot = await tx.get(roomRef(code))
    if (!snapshot.exists()) return 'missing'
    const room = snapshot.data() as Room

    if (room.playerUids.includes(uid)) {
      tx.update(playerRef(code, uid), { name, lastSeen: serverTimestamp() })
      return 'joined'
    }
    if (room.playerUids.length >= MAX_CREW) return 'full'

    // Both writes commit together or not at all (the rules check them as one: see getAfter).
    tx.update(roomRef(code), { playerUids: [...room.playerUids, uid] })
    tx.set(playerRef(code, uid), newPlayer(name, room.playerUids.length))
    return 'joined'
  })
}

export function watchRoom(
  code: string,
  onRoom: (room: Room | null) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    roomRef(code),
    (snapshot) => onRoom(snapshot.exists() ? (snapshot.data() as Room) : null),
    onError,
  )
}

const toMillis = (value: unknown) => (value instanceof Timestamp ? value.toMillis() : 0)

export function watchPlayers(
  code: string,
  onPlayers: (players: Player[]) => void,
  onError: (error: Error) => void,
): () => void {
  return onSnapshot(
    collection(firebase().db, 'rooms', code, 'players'),
    (snapshot) =>
      onPlayers(
        snapshot.docs.map((d) => {
          // Server times are null until the write lands; "estimate" fills in a local guess.
          const data = d.data({ serverTimestamps: 'estimate' })
          return {
            id: d.id,
            name: String(data.name ?? '?'),
            color: Number(data.color ?? 0),
            joinedAt: toMillis(data.joinedAt),
            lastSeen: toMillis(data.lastSeen),
            viewing: typeof data.viewing === 'string' ? data.viewing : null,
          }
        }),
      ),
    onError,
  )
}

export type ClockSample = { offsetMs: number; roundTripMs: number }

/**
 * Marks you as online and measures how far this device's clock is from Firestore's. The server
 * stamps the time somewhere between sending and receiving, so the midpoint is the best guess.
 */
export async function heartbeat(code: string, uid: string): Promise<ClockSample> {
  const ref = playerRef(code, uid)
  const sentAt = Date.now()
  await updateDoc(ref, { lastSeen: serverTimestamp() })
  const receivedAt = Date.now()
  const serverTime = toMillis((await getDocFromServer(ref)).get('lastSeen'))
  return { offsetMs: serverTime - (sentAt + receivedAt) / 2, roundTripMs: receivedAt - sentAt }
}

export function setViewing(code: string, uid: string, systemId: string | null): Promise<void> {
  return updateDoc(playerRef(code, uid), { viewing: systemId })
}

export function setDifficulty(code: string, difficultyId: DifficultyId): Promise<void> {
  return updateDoc(roomRef(code), { difficultyId })
}

export function launchGame(code: string, game: GameState): Promise<void> {
  return updateDoc(roomRef(code), { status: 'playing', game })
}

/** Same crew, same code: everyone goes back to the lobby for another round. */
export function backToLobby(code: string): Promise<void> {
  return updateDoc(roomRef(code), { status: 'lobby', game: null, round: increment(1) })
}

/**
 * Every answer, hint, pause and tick goes through here: read the room, run the same applyAction as
 * solo play, write the result. The transaction retries if someone else wrote first, so two players
 * answering at once can't overwrite each other.
 */
export function applyRemoteAction(code: string, action: GameAction): Promise<void> {
  return runTransaction(firebase().db, async (tx) => {
    const snapshot = await tx.get(roomRef(code))
    const game = (snapshot.data() as Room | undefined)?.game
    if (!game) return
    const next = applyAction(game, action)
    if (next !== game) tx.update(roomRef(code), { game: next })
  })
}
