import { useEffect, useRef, useState } from 'react'
import {
  EAST,
  NORTH,
  openings,
  routeCode,
  routeTiles,
  SOUTH,
  turnTile,
  WEST,
  type RoutingGrid,
} from '../../engine/routing.ts'

type Props = {
  grid: RoutingGrid
  /** The digits the finished run spells, entered for you the moment the power gets through. */
  onAnswer?: (code: string) => void
}

const SIDE_NAMES: Record<number, string> = {
  [NORTH]: 'top',
  [EAST]: 'right',
  [SOUTH]: 'bottom',
  [WEST]: 'left',
}

/** Where a side meets the edge of a 100×100 tile. */
const EDGE: Record<number, { x: number; y: number }> = {
  [NORTH]: { x: 50, y: 0 },
  [EAST]: { x: 100, y: 50 },
  [SOUTH]: { x: 50, y: 100 },
  [WEST]: { x: 0, y: 50 },
}

/** Cable from the middle of the tile out to each open side. */
function Cable({ open, live }: { open: number; live: boolean }) {
  const sides = [NORTH, EAST, SOUTH, WEST].filter((side) => (open & side) !== 0)
  return (
    <svg viewBox="0 0 100 100" className="size-full" aria-hidden>
      {sides.map((side) => (
        <line
          key={side}
          x1={50}
          y1={50}
          x2={EDGE[side]!.x}
          y2={EDGE[side]!.y}
          stroke={live ? 'var(--color-nominal)' : 'currentColor'}
          strokeWidth={14}
          strokeLinecap="round"
        />
      ))}
      <circle cx={50} cy={50} r={9} fill={live ? 'var(--color-nominal)' : 'currentColor'} />
    </svg>
  )
}

/**
 * The cable grid: tap a tile to turn it a quarter clockwise. When the power reaches the module the
 * whole run lights up and the panel enters the code for you, so there is nothing to type.
 */
export default function RoutingGridView({ grid: initial, onAnswer }: Props) {
  const [grid, setGrid] = useState(initial)
  const code = routeCode(grid)
  const connected = code !== ''
  // Only the cable the power actually flows through lights up, so a finished run reads at a glance.
  const live = new Set(routeTiles(grid) ?? [])

  // The run is logged once. Without this the answer would be submitted on every render while the
  // power is flowing, since the panel hands us a fresh callback each time.
  const logged = useRef(false)
  useEffect(() => {
    if (!connected || logged.current || !onAnswer) return
    logged.current = true
    onAnswer(code)
  }, [connected, code, onAnswer])

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <Terminal label="Reactor" row={grid.entryRow} rows={grid.rows} live={connected} />

        <div
          role="group"
          aria-label="Cable grid"
          className="grid flex-1 gap-1.5 rounded-xl border border-line bg-void/60 p-2"
          style={{ gridTemplateColumns: `repeat(${grid.columns}, minmax(0, 1fr))` }}
        >
          {grid.tiles.map((tile, index) => {
            const open = openings(tile)
            const sides = [NORTH, EAST, SOUTH, WEST]
              .filter((side) => (open & side) !== 0)
              .map((side) => SIDE_NAMES[side])
              .join(' and ')
            return (
              <button
                key={index}
                type="button"
                disabled={!onAnswer}
                onClick={() => setGrid((current) => turnTile(current, index))}
                aria-label={`Tile ${index + 1}, cable to the ${sides}. Turn it.`}
                className={`aspect-square rounded-lg border p-0.5 text-ink-muted transition-colors enabled:hover:border-ink-muted/60 ${
                  live.has(index) ? 'border-nominal/40 bg-nominal/5' : 'border-line bg-panel/40'
                }`}
              >
                <Cable open={open} live={live.has(index)} />
              </button>
            )
          })}
        </div>

        <Terminal label="Module" row={grid.exitRow} rows={grid.rows} live={connected} />
      </div>

      <p aria-live="polite" className="font-display text-xs text-ink-muted">
        {connected ? `● Power restored · run logged as ${code}` : '○ No path from the reactor yet'}
      </p>
    </div>
  )
}

/** The reactor and the module, drawn as a lug on the row the cable has to meet. */
function Terminal({
  label,
  row,
  rows,
  live,
}: {
  label: string
  row: number
  rows: number
  live: boolean
}) {
  return (
    <div
      className="grid w-12 shrink-0 gap-1.5 py-2"
      style={{ gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="flex items-center justify-center">
          {index === row && (
            <span
              className={`w-full rounded px-1 py-2 text-center font-display text-[9px] tracking-[0.06em] uppercase ${
                live ? 'bg-nominal/20 text-nominal' : 'bg-panel-raised text-ink-muted'
              }`}
            >
              {label}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
