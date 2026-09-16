import { dealPieces, EVIDENCE_SLOT } from '../engine/deal.ts'
import type { GameState } from '../engine/game.ts'
import { isOnline, type Player } from '../store/crew.ts'
import type { PieceView } from './components/PuzzlePieces.tsx'
import type { Viewer } from './components/SystemCard.tsx'

/** Everyone in the crew in join order, and who is connected. Used for every deal. */
function table(playerId: string, players: readonly Player[], now: number) {
  const seats = [...players]
    .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
    .map((p) => p.id)
  if (!seats.includes(playerId)) seats.push(playerId)
  // This device always counts itself as online, so a slow heartbeat never hides your own pieces.
  const online = new Set([playerId, ...players.filter((p) => isOnline(p, now)).map((p) => p.id)])
  return { seats, online }
}

const viewerOf = (players: readonly Player[], id: string | undefined, playerId: string) => {
  const holder = players.find((p) => p.id === id && p.id !== playerId)
  return holder ? { id: holder.id, name: holder.name, color: holder.color } : null
}

/**
 * Who holds each evidence card, in board order: `null` means you. Undefined in a solo game, where
 * every card is yours. The crew has to read their cards out to work out who the traitor is.
 */
export function evidenceHolders(
  game: GameState,
  playerId: string,
  players: readonly Player[] = [],
  now = 0,
): (Viewer | null)[] | undefined {
  if (!game.split) return undefined
  const { seats, online } = table(playerId, players, now)
  const holders = dealPieces({
    seed: game.seed,
    systemIndex: EVIDENCE_SLOT,
    pieceCount: game.mystery.evidence.length,
    seats,
    online,
  })
  return holders.map((id) => viewerOf(players, id, playerId))
}

/**
 * A split system's pieces as this player sees them: their own, and who holds each of the others.
 * Solo play passes no players, so every piece is yours. Undefined for systems that aren't split.
 */
export function piecesFor(
  game: GameState,
  systemIndex: number,
  playerId: string,
  players: readonly Player[] = [],
  now = 0,
): PieceView[] | undefined {
  const pieces = game.systems[systemIndex]?.puzzle.pieces
  if (!pieces) return undefined

  const { seats, online } = table(playerId, players, now)
  const holders = dealPieces({
    seed: game.seed,
    systemIndex,
    pieceCount: pieces.length,
    seats,
    online,
  })
  return pieces.map((piece, i) => ({ piece, holder: viewerOf(players, holders[i], playerId) }))
}
