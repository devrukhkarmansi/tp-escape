import { useRef, useState, type PointerEvent as ReactPointerEvent } from 'react'
import { shiftLetters } from '../../engine/puzzles/caesar.ts'

const ALPHABET = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']
const STEP = 360 / ALPHABET.length

type Props = {
  coded: string
  /** Fills the answer box as the ring turns. The crew still decides when to send it. */
  onDraft?: (value: string) => void
}

/** Where a letter sits on a ring of the given radius, with 0° at the top. */
function letterAt(index: number, radius: number, turned: number) {
  const angle = ((index * STEP + turned - 90) * Math.PI) / 180
  return { x: 50 + radius * Math.cos(angle), y: 50 + radius * Math.sin(angle) }
}

/**
 * Two letter rings: the hull's fixed alphabet outside, the turning ring inside. Turning it shifts
 * every letter of the message at once, and the decode under the wheel updates as you go.
 */
export default function CipherWheel({ coded, onDraft }: Props) {
  const [offset, setOffset] = useState(0)
  const wheel = useRef<SVGSVGElement>(null)
  const dragFrom = useRef<{ angle: number; offset: number } | null>(null)

  const decoded = shiftLetters(coded, -offset)

  function turn(to: number) {
    const next = ((to % 26) + 26) % 26
    setOffset(next)
    onDraft?.(shiftLetters(coded, -next))
  }

  /** The angle of a pointer around the middle of the wheel, in ring steps. */
  function stepsAt(event: ReactPointerEvent) {
    const box = wheel.current?.getBoundingClientRect()
    if (!box) return 0
    const x = event.clientX - (box.left + box.width / 2)
    const y = event.clientY - (box.top + box.height / 2)
    return (Math.atan2(y, x) * 180) / Math.PI / STEP
  }

  function startDrag(event: ReactPointerEvent) {
    if (!onDraft) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragFrom.current = { angle: stepsAt(event), offset }
  }

  function drag(event: ReactPointerEvent) {
    const from = dragFrom.current
    if (!from) return
    // Dragging clockwise turns the ring clockwise: one letter per step of the way round.
    turn(from.offset + Math.round(stepsAt(event) - from.angle))
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-center font-display text-2xl tracking-[0.3em] break-all sm:text-3xl">
        {coded}
      </p>

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={!onDraft}
          onClick={() => turn(offset - 1)}
          aria-label="Turn the ring back one letter"
          className="min-h-12 min-w-12 rounded-lg border border-line font-display text-lg enabled:hover:border-ink-muted/60 disabled:opacity-40"
        >
          ◀
        </button>

        <svg
          ref={wheel}
          viewBox="0 0 100 100"
          role="img"
          aria-label={`Cipher wheel, turned ${offset} of 26 steps. The message reads ${decoded}.`}
          onPointerDown={startDrag}
          onPointerMove={drag}
          onPointerUp={() => (dragFrom.current = null)}
          onPointerCancel={() => (dragFrom.current = null)}
          className="size-56 touch-none select-none sm:size-64"
        >
          <circle cx={50} cy={50} r={47} fill="none" stroke="currentColor" strokeOpacity={0.25} />
          <circle cx={50} cy={50} r={33} fill="none" stroke="currentColor" strokeOpacity={0.25} />
          {ALPHABET.map((letter, index) => {
            const outer = letterAt(index, 41, 0)
            const inner = letterAt(index, 26, offset * STEP)
            return (
              <g key={letter} fontFamily="Space Mono, monospace" textAnchor="middle">
                <text x={outer.x} y={outer.y + 2} fontSize={6} fill="currentColor" opacity={0.75}>
                  {letter}
                </text>
                <text x={inner.x} y={inner.y + 2.2} fontSize={6.5} fill="var(--color-nominal)">
                  {letter}
                </text>
              </g>
            )
          })}
          {/* The notch: the pair of letters lined up at the top is the key to the whole message. */}
          <polygon points="50,2 47,8 53,8" fill="var(--color-caution)" />
        </svg>

        <button
          type="button"
          disabled={!onDraft}
          onClick={() => turn(offset + 1)}
          aria-label="Turn the ring on one letter"
          className="min-h-12 min-w-12 rounded-lg border border-line font-display text-lg enabled:hover:border-ink-muted/60 disabled:opacity-40"
        >
          ▶
        </button>
      </div>

      <p className="rounded-xl border border-line bg-void/60 px-5 py-4 text-center font-display text-2xl font-bold tracking-[0.25em] break-all text-nominal sm:text-3xl">
        {decoded}
      </p>
      <p aria-live="polite" className="sr-only">
        The message reads {decoded}
      </p>
    </div>
  )
}
