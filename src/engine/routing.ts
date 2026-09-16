/**
 * The cable grid behind the power-routing puzzle. Each tile is a piece of cable with openings on
 * some of its sides; turning a tile turns its openings with it. Power flows from the reactor on the
 * left edge to the module on the right, through tiles whose openings meet.
 *
 * Both the generator and the screen use these functions, so what you see is what the engine checks.
 */

/** Openings as a bitmask, so turning a tile is a rotate of four bits. */
export const NORTH = 1
export const EAST = 2
export const SOUTH = 4
export const WEST = 8

export type RoutingTile = {
  /** Which sides are open before the tile is turned. */
  mask: number
  /** Quarter turns clockwise, 0–3. This is the bit players change. */
  turns: number
  /** Printed on the tile. The digits along the finished route are the answer. */
  digit: number
}

export type RoutingGrid = {
  columns: number
  rows: number
  tiles: RoutingTile[]
  /** Which row the reactor feeds, and which row the module sits on. */
  entryRow: number
  exitRow: number
}

/** A tile's openings once its turns are applied. */
export function openings(tile: RoutingTile): number {
  const turned = ((tile.mask << tile.turns) | (tile.mask >> (4 - tile.turns))) & 0b1111
  return turned
}

const OPPOSITE: Record<number, number> = {
  [NORTH]: SOUTH,
  [SOUTH]: NORTH,
  [EAST]: WEST,
  [WEST]: EAST,
}

const STEP: Record<number, { dx: number; dy: number }> = {
  [NORTH]: { dx: 0, dy: -1 },
  [EAST]: { dx: 1, dy: 0 },
  [SOUTH]: { dx: 0, dy: 1 },
  [WEST]: { dx: -1, dy: 0 },
}

const isOpen = (tile: RoutingTile, side: number) => (openings(tile) & side) !== 0

/**
 * Follows the power from the reactor and returns the tiles it flows through, in order, or null if
 * it never reaches the module: a dead end, a tile turned the wrong way, or a loop.
 */
export function routeTiles(grid: RoutingGrid): number[] | null {
  const { columns, rows, tiles, entryRow, exitRow } = grid
  const at = (x: number, y: number) => tiles[y * columns + x]
  let x = 0
  let y = entryRow
  let from = WEST
  const visited: number[] = []

  // A route can never be longer than the grid, so this also catches loops.
  for (let step = 0; step <= columns * rows; step++) {
    const tile = at(x, y)
    if (!tile || !isOpen(tile, from)) return null
    visited.push(y * columns + x)

    const next = [NORTH, EAST, SOUTH, WEST].find(
      (side) => side !== from && isOpen(tile, side) && (side !== WEST || x > 0),
    )
    if (next === undefined) return null
    if (next === EAST && x === columns - 1) {
      return y === exitRow ? visited : null
    }
    x += STEP[next]!.dx
    y += STEP[next]!.dy
    if (x < 0 || y < 0 || y >= rows) return null
    from = OPPOSITE[next]!
  }
  return null
}

/** The digits along the finished run, or an empty string while the power is still stuck. */
export function routeCode(grid: RoutingGrid): string {
  const route = routeTiles(grid)
  return route ? route.map((index) => grid.tiles[index]!.digit).join('') : ''
}

/** True when every tile is turned as the puzzle was built, i.e. the player has not scrambled it. */
export function isSolved(grid: RoutingGrid): boolean {
  return routeCode(grid) !== ''
}

/** The same grid with one tile turned a quarter clockwise: what a tap does. */
export function turnTile(grid: RoutingGrid, index: number): RoutingGrid {
  return {
    ...grid,
    tiles: grid.tiles.map((tile, i) =>
      i === index ? { ...tile, turns: (tile.turns + 1) % 4 } : tile,
    ),
  }
}
