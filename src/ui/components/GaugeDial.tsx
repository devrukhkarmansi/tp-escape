type Props = { index: number; value: number; reversed: boolean; labelEvery: number }

const CX = 50
const CY = 52
const R = 40

// Ticks 0–9 across a half circle, left to right.
const angleFor = (position: number) => Math.PI - (position / 9) * Math.PI
const pointAt = (position: number, radius: number) => ({
  x: CX + radius * Math.cos(angleFor(position)),
  y: CY - radius * Math.sin(angleFor(position)),
})

/** One analog dial. A reversed dial prints its scale backwards, 9 on the left down to 0. */
export default function GaugeDial({ index, value, reversed, labelEvery }: Props) {
  const needleAt = reversed ? 9 - value : value
  // The needle stops short of the printed numbers, so it points at one without covering it.
  const tip = pointAt(needleAt, R - 21)
  const positions = Array.from({ length: 10 }, (_, i) => i)
  const labelled = (position: number) => position % labelEvery === 0 || position === 9

  return (
    <figure className="flex flex-col items-center gap-1">
      <svg
        viewBox="0 0 100 64"
        className="w-full max-w-44 text-ink"
        role="img"
        aria-label={`Dial ${index + 1}: needle on tick ${needleAt} of 0 to 9${reversed ? ', scale printed backwards' : ''}`}
      >
        <path
          d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`}
          fill="none"
          stroke="currentColor"
          strokeOpacity={0.35}
          strokeWidth={1.5}
        />
        {positions.map((position) => {
          const outer = pointAt(position, R)
          const inner = pointAt(position, labelled(position) ? R - 6 : R - 4)
          const text = pointAt(position, R - 14)
          return (
            <g key={position}>
              <line
                x1={outer.x}
                y1={outer.y}
                x2={inner.x}
                y2={inner.y}
                stroke="currentColor"
                strokeWidth={labelled(position) ? 1.6 : 1}
              />
              {labelled(position) && (
                <text
                  x={text.x}
                  y={text.y + 3.5}
                  textAnchor="middle"
                  fontSize={10}
                  fontFamily="Space Mono, monospace"
                  fill="currentColor"
                >
                  {reversed ? 9 - position : position}
                </text>
              )}
            </g>
          )
        })}
        <line
          x1={CX}
          y1={CY}
          x2={tip.x}
          y2={tip.y}
          stroke="var(--color-nominal)"
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <circle cx={CX} cy={CY} r={3.2} fill="var(--color-nominal)" />
      </svg>
      <figcaption className="font-display text-[10px] tracking-[0.1em] text-ink-muted uppercase">
        Dial {index + 1}
        {reversed ? ' ↺' : ''}
      </figcaption>
    </figure>
  )
}
