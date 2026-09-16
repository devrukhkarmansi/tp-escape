/**
 * Test-only helpers that talk to the Firestore emulator over its REST API. They let a test read
 * the crew's game (to know the answers) and open every system without playing through them.
 */
const PROJECT = 'demo-tp-escape'
const BASE = `http://localhost:8180/v1/projects/${PROJECT}/databases/(default)/documents/rooms`

type Field = Record<string, unknown>

async function readRoom(code: string): Promise<Field> {
  const response = await fetch(`${BASE}/${code}`, { headers: { Authorization: 'Bearer owner' } })
  if (!response.ok) throw new Error(`Could not read crew ${code}: ${response.status}`)
  return (await response.json()) as Field
}

const fieldsOf = (value: Field) => (value.mapValue as Field).fields as Record<string, Field>
const systemsOf = (room: Field) => {
  const game = fieldsOf((room.fields as Record<string, Field>).game!)
  return ((game.systems!.arrayValue as Field).values as Field[]).map(fieldsOf)
}

export type SystemInfo = {
  name: string
  kind: string
  answer: string
  /** Split systems have their pieces on different players' screens. */
  split: boolean
}

export async function systems(code: string): Promise<SystemInfo[]> {
  return systemsOf(await readRoom(code)).map((system) => {
    const puzzle = fieldsOf(system.puzzle!)
    return {
      name: system.name!.stringValue as string,
      kind: puzzle.kind!.stringValue as string,
      answer: puzzle.answer!.stringValue as string,
      split: 'pieces' in puzzle,
    }
  })
}

/** Opens every system, so a test can go straight to the one it cares about. */
export async function openEverySystem(code: string): Promise<void> {
  const room = await readRoom(code)
  for (const system of systemsOf(room)) {
    if (fieldsOf(system.puzzle!).kind!.stringValue !== 'finale') {
      system.status!.stringValue = 'open'
    }
  }
  const game = (room.fields as Record<string, Field>).game
  const response = await fetch(`${BASE}/${code}?updateMask.fieldPaths=game`, {
    method: 'PATCH',
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields: { game } }),
  })
  if (!response.ok) throw new Error(`Could not open the systems: ${response.status}`)
}
