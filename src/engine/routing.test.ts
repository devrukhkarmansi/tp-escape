import { describe, expect, it } from 'vitest'
import {
  EAST,
  NORTH,
  openings,
  routeCode,
  SOUTH,
  turnTile,
  WEST,
  type RoutingGrid,
} from './routing.ts'

const tile = (mask: number, turns = 0, digit = 1) => ({ mask, turns, digit })

/** A one-row grid: west-east straight all the way across. */
const straightRun = (turns: number[]): RoutingGrid => ({
  columns: 3,
  rows: 1,
  entryRow: 0,
  exitRow: 0,
  tiles: turns.map((t, i) => tile(EAST | WEST, t, i + 1)),
})

describe('openings', () => {
  it('turns a tile’s open sides with it, a quarter at a time', () => {
    expect(openings(tile(NORTH))).toBe(NORTH)
    expect(openings(tile(NORTH, 1))).toBe(EAST)
    expect(openings(tile(NORTH, 2))).toBe(SOUTH)
    expect(openings(tile(NORTH, 3))).toBe(WEST)
    expect(openings(tile(NORTH, 4 % 4))).toBe(NORTH)
  })

  it('turns both ends of a straight together', () => {
    expect(openings(tile(EAST | WEST, 1))).toBe(NORTH | SOUTH)
  })
})

describe('routeCode', () => {
  it('reads the digits the power passes, in order', () => {
    expect(routeCode(straightRun([0, 0, 0]))).toBe('123')
  })

  it('is empty when a tile is turned the wrong way', () => {
    expect(routeCode(straightRun([0, 1, 0]))).toBe('')
  })

  it('is empty when the run reaches the right edge on the wrong row', () => {
    const grid = straightRun([0, 0, 0])
    expect(routeCode({ ...grid, rows: 2, exitRow: 1 })).toBe('')
  })

  it('follows a run that changes row', () => {
    // Reactor → elbow down → elbow right → straight → module, on the second row.
    const grid: RoutingGrid = {
      columns: 2,
      rows: 2,
      entryRow: 0,
      exitRow: 1,
      tiles: [
        tile(WEST | SOUTH, 0, 4),
        tile(EAST | WEST, 0, 9),
        tile(NORTH | EAST, 0, 7),
        tile(EAST | WEST, 0, 2),
      ],
    }
    expect(routeCode(grid)).toBe('472')
  })

  it('never loops for ever on a ring of cable', () => {
    const ring: RoutingGrid = {
      columns: 2,
      rows: 2,
      entryRow: 0,
      exitRow: 0,
      tiles: [
        tile(WEST | SOUTH, 0, 1),
        tile(SOUTH | WEST, 0, 2),
        tile(NORTH | EAST, 0, 3),
        tile(NORTH | WEST, 0, 4),
      ],
    }
    expect(routeCode(ring)).toBe('')
  })
})

describe('turnTile', () => {
  it('turns one tile and leaves the rest alone', () => {
    const before = straightRun([0, 1, 0])
    const after = turnTile(before, 1)
    expect(after.tiles[1]!.turns).toBe(2)
    expect(after.tiles[0]).toEqual(before.tiles[0])
    expect(before.tiles[1]!.turns, 'the original grid is untouched').toBe(1)
  })

  it('comes back round after four turns', () => {
    let grid = straightRun([0, 1, 0])
    for (let i = 0; i < 4; i++) grid = turnTile(grid, 1)
    expect(grid.tiles[1]!.turns).toBe(1)
  })
})
