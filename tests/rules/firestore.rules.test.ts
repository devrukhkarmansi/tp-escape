// Runs against the Firestore emulator: `npm run test:rules` starts it, runs these, and stops it.
import { readFileSync } from 'node:fs'
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing'
import {
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'

const CODE = 'K7QXM'
let env: RulesTestEnvironment

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-tp-escape',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  })
})
afterAll(() => env.cleanup())
beforeEach(() => env.clearFirestore())

/** A Firestore client signed in as `uid`, or signed out. */
function db(uid?: string) {
  return (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore()
}

function roomData(playerUids: string[], code = CODE) {
  return { code, difficultyId: 'full', playerUids, status: 'lobby', game: null, round: 0 }
}

/** Sets up a room directly, skipping the rules, so each test starts from a known state. */
async function seedRoom(playerUids: string[]) {
  await env.withSecurityRulesDisabled(async (context) => {
    const admin = context.firestore()
    await setDoc(doc(admin, 'rooms', CODE), roomData(playerUids))
    for (const uid of playerUids) {
      await setDoc(doc(admin, 'rooms', CODE, 'players', uid), { name: uid })
    }
  })
}

/** How the app will create a room: the room and the host's player doc in one atomic write. */
function createRoom(uid: string, code = CODE, playerUids = [uid]) {
  const client = db(uid)
  const batch = writeBatch(client)
  batch.set(doc(client, 'rooms', code), roomData(playerUids, code))
  batch.set(doc(client, 'rooms', code, 'players', uid), { name: 'Host' })
  return batch.commit()
}

/** How the app will join: add yourself to the crew and create your player doc together. */
function join(uid: string, extra: Record<string, unknown> = {}) {
  const client = db(uid)
  const batch = writeBatch(client)
  batch.update(doc(client, 'rooms', CODE), { playerUids: arrayUnion(uid), ...extra })
  batch.set(doc(client, 'rooms', CODE, 'players', uid), { name: uid })
  return batch.commit()
}

describe('rooms', () => {
  it('cannot be read when signed out', async () => {
    await seedRoom(['host'])
    await assertFails(getDoc(doc(db(), 'rooms', CODE)))
  })

  it('can be opened by anyone signed in who has the code', async () => {
    await seedRoom(['host'])
    await assertSucceeds(getDoc(doc(db('stranger'), 'rooms', CODE)))
  })

  it('can never be listed, so nobody can browse other crews', async () => {
    await seedRoom(['host'])
    await assertFails(getDocs(collection(db('host'), 'rooms')))
  })

  it('can be created with yourself as the only player', async () => {
    await assertSucceeds(createRoom('host'))
  })

  it('need a 5-character code without look-alike characters', async () => {
    await assertFails(createRoom('host', 'K0QXM'))
    await assertFails(createRoom('host', 'K1QXM'))
    await assertFails(createRoom('host', 'k7qxm'))
    await assertFails(createRoom('host', 'K7QX'))
  })

  it('cannot be created with someone else in the crew', async () => {
    await assertFails(createRoom('host', CODE, ['someone-else']))
    await assertFails(createRoom('host', CODE, ['host', 'someone-else']))
  })

  it('cannot be deleted, even by the crew', async () => {
    await seedRoom(['host'])
    await assertFails(deleteDoc(doc(db('host'), 'rooms', CODE)))
  })
})

describe('joining', () => {
  it('adds you and your player doc in one write', async () => {
    await seedRoom(['host'])
    await assertSucceeds(join('player-2'))
  })

  it('turns away a 7th player', async () => {
    await seedRoom(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'])
    await assertFails(join('p7'))
  })

  it('can only add yourself', async () => {
    await seedRoom(['host'])
    const client = db('player-2')
    await assertFails(
      updateDoc(doc(client, 'rooms', CODE), { playerUids: arrayUnion('someone-else') }),
    )
  })

  it("can't change anything else about the room on the way in", async () => {
    await seedRoom(['host'])
    await assertFails(join('player-2', { status: 'playing' }))
  })

  it("won't let you create a player doc without joining the crew", async () => {
    await seedRoom(['host'])
    await assertFails(
      setDoc(doc(db('outsider'), 'rooms', CODE, 'players', 'outsider'), { name: 'Sneaky' }),
    )
  })
})

describe('crew members', () => {
  it('can update the game', async () => {
    await seedRoom(['host', 'player-2'])
    await assertSucceeds(
      updateDoc(doc(db('player-2'), 'rooms', CODE), { status: 'playing', game: { seed: 1 } }),
    )
  })

  it('can read the crew list', async () => {
    await seedRoom(['host', 'player-2'])
    await assertSucceeds(getDocs(collection(db('player-2'), 'rooms', CODE, 'players')))
  })

  it("can't remove other players", async () => {
    await seedRoom(['host', 'player-2'])
    await assertFails(updateDoc(doc(db('player-2'), 'rooms', CODE), { playerUids: ['player-2'] }))
  })

  it("can't change the room's code", async () => {
    await seedRoom(['host'])
    await assertFails(updateDoc(doc(db('host'), 'rooms', CODE), { code: 'ZZZZZ' }))
  })

  it('are the only ones who can change the game', async () => {
    await seedRoom(['host'])
    await assertFails(updateDoc(doc(db('outsider'), 'rooms', CODE), { status: 'playing' }))
  })
})

describe('player docs', () => {
  it('can be updated by their owner', async () => {
    await seedRoom(['host', 'player-2'])
    await assertSucceeds(
      setDoc(doc(db('player-2'), 'rooms', CODE, 'players', 'player-2'), {
        name: 'Ravi',
        viewing: 'system-3',
      }),
    )
  })

  it("can't be written by anyone else", async () => {
    await seedRoom(['host', 'player-2'])
    await assertFails(
      setDoc(doc(db('player-2'), 'rooms', CODE, 'players', 'host'), { name: 'Renamed' }),
    )
  })

  it('need a name of 1 to 16 characters', async () => {
    await seedRoom(['host'])
    const own = doc(db('host'), 'rooms', CODE, 'players', 'host')
    await assertFails(setDoc(own, { name: '' }))
    await assertFails(setDoc(own, { name: 'x'.repeat(17) }))
    await assertFails(setDoc(own, { name: 42 }))
    await assertSucceeds(setDoc(own, { name: 'x'.repeat(16) }))
  })

  it('cannot be deleted', async () => {
    await seedRoom(['host'])
    await assertFails(deleteDoc(doc(db('host'), 'rooms', CODE, 'players', 'host')))
  })
})
