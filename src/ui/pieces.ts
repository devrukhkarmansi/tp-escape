import { dealPieces } from '../engine/deal.ts'
import type { GameState } from '../engine/game.ts'
import { isOnline, type Player } from '../store/crew.ts'
import type { PieceView } from './components/PuzzlePieces.tsx'

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

  const seats = [...players]
    .sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id))
    .map((p) => p.id)
  if (!seats.includes(playerId)) seats.push(playerId)
  // This device always counts itself as online, so a slow heartbeat never hides your own pieces.
  const online = new Set([playerId, ...players.filter((p) => isOnline(p, now)).map((p) => p.id)])

  const holders = dealPieces({
    seed: game.seed,
    systemIndex,
    pieceCount: pieces.length,
    seats,
    online,
  })
  return pieces.map((piece, i) => {
    const holder = players.find((p) => p.id === holders[i] && p.id !== playerId)
    return {
      piece,
      holder: holder ? { id: holder.id, name: holder.name, color: holder.color } : null,
    }
  })
}
