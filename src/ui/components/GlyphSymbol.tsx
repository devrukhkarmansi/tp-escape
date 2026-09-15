// 26 alien symbols, each 3 strokes on a 3×3 grid. Built once from a fixed list, so symbol N always
// looks the same on every phone.
const POINTS: readonly (readonly [number, number])[] = [
  [4, 4],
  [12, 4],
  [20, 4],
  [4, 12],
  [12, 12],
  [20, 12],
  [4, 20],
  [12, 20],
  [20, 20],
]

// Each stroke joins two grid points (by index into POINTS); "ring" is a small circle in the middle.
const STROKES: readonly (readonly [number, number] | 'ring')[] = [
  [0, 2],
  [6, 8],
  [0, 6],
  [2, 8],
  [1, 7],
  [3, 5],
  [0, 8],
  [2, 6],
  [0, 4],
  [2, 4],
  [4, 7],
  'ring',
]

function combinations(size: number, count: number): number[][] {
  const out: number[][] = []
  const pick = (start: number, chosen: number[]) => {
    if (chosen.length === size) return void out.push(chosen)
    for (let i = start; i < count; i++) pick(i + 1, [...chosen, i])
  }
  pick(0, [])
  return out
}

// 220 three-stroke combinations; every 8th spreads the 26 symbols across very different shapes.
const SYMBOLS = combinations(3, STROKES.length)
  .filter((_, i) => i % 8 === 3)
  .slice(0, 26)

type Props = { glyph: number; size?: number; label?: string }

export default function GlyphSymbol({ glyph, size = 40, label }: Props) {
  const strokes = SYMBOLS[glyph % SYMBOLS.length] ?? []
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.2}
      strokeLinecap="round"
      role="img"
      aria-label={label ?? `symbol ${glyph + 1}`}
    >
      {strokes.map((index) => {
        const stroke = STROKES[index]!
        if (stroke === 'ring') return <circle key={index} cx={12} cy={12} r={3.5} />
        const [a, b] = stroke
        const [x1, y1] = POINTS[a]!
        const [x2, y2] = POINTS[b]!
        return <line key={index} x1={x1} y1={y1} x2={x2} y2={y2} />
      })}
    </svg>
  )
}
