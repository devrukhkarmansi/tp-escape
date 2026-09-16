import type { PuzzleGenerator } from '../puzzle.ts'
import type { Rng } from '../rng.ts'
import {
  EAST,
  NORTH,
  routeCode,
  SOUTH,
  WEST,
  type RoutingGrid,
  type RoutingTile,
} from '../routing.ts'
import { band, flavor } from './shared.ts'

type Cell = { x: number; y: number }

const SIDES = [
  { side: NORTH, dx: 0, dy: -1 },
  { side: EAST, dx: 1, dy: 0 },
  { side: SOUTH, dx: 0, dy: 1 },
  { side: WEST, dx: -1, dy: 0 },
] as const

const sideBetween = (from: Cell, to: Cell) =>
  SIDES.find((s) => from.x + s.dx === to.x && from.y + s.dy === to.y)!.side

/**
 * Carves one winding cable run from the reactor to the module: a random walk that never crosses
 * itself, backtracking whenever it paints itself into a corner.
 */
function carvePath(rng: Rng, columns: number, rows: number, entryRow: number, exitRow: number) {
  const start: Cell = { x: 0, y: entryRow }
  const seen = new Set([`0,${entryRow}`])
  const path: Cell[] = [start]

  const walk = (): boolean => {
    const here = path.at(-1)!
    if (here.x === columns - 1 && here.y === exitRow) return true
    for (const { dx, dy } of rng.shuffle([...SIDES])) {
      const next = { x: here.x + dx, y: here.y + dy }
      const key = `${next.x},${next.y}`
      const inside = next.x >= 0 && next.x < columns && next.y >= 0 && next.y < rows
      // The module is the only way out on the right, so the run can't wander off that edge.
      if (!inside || seen.has(key)) continue
      if (next.x === columns - 1 && next.y !== exitRow && here.x === columns - 1) continue
      seen.add(key)
      path.push(next)
      if (walk()) return true
      path.pop()
      seen.delete(key)
    }
    return false
  }

  return walk() ? path : null
}

/** Turns the carved run into tiles: each one opens towards the tiles either side of it. */
function tilesForPath(rng: Rng, columns: number, rows: number, path: Cell[]): RoutingTile[] {
  const masks = new Map<string, number>()
  path.forEach((cell, index) => {
    const before = index === 0 ? WEST : sideBetween(cell, path[index - 1]!)
    const after = index === path.length - 1 ? EAST : sideBetween(cell, path[index + 1]!)
    masks.set(`${cell.x},${cell.y}`, before | after)
  })

  // Every tile has exactly two openings, so the power always has one way in and one way out.
  const decoys = [
    NORTH | SOUTH,
    EAST | WEST,
    NORTH | EAST,
    EAST | SOUTH,
    SOUTH | WEST,
    WEST | NORTH,
  ]
  return Array.from({ length: columns * rows }, (_, index) => {
    const x = index % columns
    const y = Math.floor(index / columns)
    const mask = masks.get(`${x},${y}`) ?? rng.pick(decoys)
    return { mask, turns: 0, digit: rng.int(1, 9) }
  })
}

const SIZES = [
  { columns: 3, rows: 3 },
  { columns: 4, rows: 3 },
  { columns: 4, rows: 4 },
] as const

/**
 * Power routing: turn the cable tiles until the reactor reaches the module. No words at all —
 * you read the grid, not a sentence. The digits the finished run passes through are the answer,
 * and the screen enters them for you the moment the power gets through.
 */
export const routing: PuzzleGenerator = {
  kind: 'routing',
  generate(rng, { level, theme }) {
    const stage = band(level)
    const { columns, rows } = SIZES[stage]!
    const entryRow = rng.int(0, rows - 1)
    const exitRow = rng.int(0, rows - 1)

    // Carving can fail on an unlucky walk; a fresh entry row is enough to get going again.
    let path = carvePath(rng, columns, rows, entryRow, exitRow)
    for (let attempt = 0; !path && attempt < 20; attempt++) {
      path = carvePath(rng, columns, rows, rng.int(0, rows - 1), exitRow)
    }
    if (!path) throw new Error('Could not lay a cable run')

    const solved: RoutingGrid = {
      columns,
      rows,
      entryRow: path[0]!.y,
      exitRow,
      tiles: tilesForPath(rng, columns, rows, path),
    }
    const answer = routeCode(solved)

    // Scramble the turns. If that happens to leave the power flowing, turn the reactor's own tile
    // until it doesn't: every tile has two open sides, so some quarter turn always shuts the west
    // one, and that tile is certainly on the run.
    const entryIndex = path[0]!.y * columns
    const scrambled: RoutingGrid = {
      ...solved,
      tiles: solved.tiles.map((tile) => ({ ...tile, turns: rng.int(0, 3) })),
    }
    for (let turn = 0; turn < 4 && routeCode(scrambled) !== ''; turn++) {
      const entry = scrambled.tiles[entryIndex]!
      scrambled.tiles[entryIndex] = { ...entry, turns: (entry.turns + 1) % 4 }
    }

    const intro = flavor(rng, theme, 'routing', 'The power grid is a mess of loose cable')
    return {
      prompt: `${intro}. Tap a tile to turn it. Get the power from the reactor on the left to the module on the right; the panel logs the run for you.`,
      visual: { type: 'routing', grid: scrambled },
      answer,
      hints: [
        'Start at the reactor and follow the cable one tile at a time. Every tile has exactly two ends.',
        'Work out which row the module sits on, then build towards it rather than turning tiles at random.',
        `The run passes ${answer.length} tiles.`,
      ],
    }
  },
}
