import type { PuzzlePiece } from '../../engine/puzzle.ts'
import { playerColor } from '../crew-ui.ts'
import { displayClass } from '../labels.ts'
import PuzzleVisualView from './PuzzleVisualView.tsx'
import type { Viewer } from './SystemCard.tsx'

/** A piece of a split puzzle, and who holds it: `null` means this player. */
export type PieceView = { piece: PuzzlePiece; holder: Viewer | null }

type Props = { kind: string; pieces: readonly PieceView[] }

/**
 * A split puzzle: the pieces you hold, and a placeholder naming who holds each of the others.
 * When you hold every piece (playing alone, or everyone else dropped out) it's the whole puzzle.
 */
export default function PuzzlePieces({ kind, pieces }: Props) {
  const shared = pieces.some((p) => p.holder)

  return (
    <div className="flex flex-col gap-4">
      {shared && (
        <p className="rounded-lg border border-ink-muted/30 bg-ink-muted/5 px-4 py-3 text-sm/6">
          <span className="block font-display text-[10px] tracking-[0.12em] text-ink uppercase">
            ◆ Split system
          </span>
          The pieces of this puzzle are on different screens. Tell each other what you see.
        </p>
      )}

      {pieces.map(({ piece, holder }) =>
        holder ? (
          <section
            key={piece.label}
            aria-label={`${piece.label}, on ${holder.name}'s screen`}
            className="flex flex-col gap-2 rounded-xl border border-dashed border-line px-5 py-4"
          >
            <PieceLabel label={piece.label} />
            <p className="text-sm/6 text-ink-muted">
              On{' '}
              <span
                className={`rounded px-1.5 py-0.5 font-display text-xs ${playerColor(holder.color).tag}`}
              >
                {holder.name}
              </span>
              ’s screen. Ask them what it shows.
            </p>
          </section>
        ) : (
          <section key={piece.label} aria-label={piece.label} className="flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3">
              <PieceLabel label={piece.label} />
              {shared && (
                <span className="font-display text-[10px] text-ink-muted">Only on your screen</span>
              )}
            </div>
            {piece.text && <p className="text-sm/6">{piece.text}</p>}
            {piece.display && (
              <p
                className={`rounded-xl border border-line bg-void/60 px-5 py-6 text-center ${displayClass(kind)}`}
              >
                {piece.display}
              </p>
            )}
            {piece.visual && <PuzzleVisualView visual={piece.visual} />}
          </section>
        ),
      )}
    </div>
  )
}

function PieceLabel({ label }: { label: string }) {
  return (
    <h3 className="font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">{label}</h3>
  )
}
