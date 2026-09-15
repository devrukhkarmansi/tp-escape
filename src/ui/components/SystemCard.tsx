import { isFinale, type StationSystem, type SystemStatus } from '../../engine/game.ts'
import { playerColor } from '../crew-ui.ts'
import { puzzleKindLabel } from '../labels.ts'

const STATUS_TAG: Record<SystemStatus, { text: string; className: string }> = {
  open: { text: 'Open', className: 'bg-nominal/12 text-nominal' },
  solved: { text: '✓ Restored', className: 'bg-nominal/25 text-nominal' },
  locked: { text: 'Locked', className: 'bg-ink-muted/15 text-ink-muted' },
}

export type Viewer = { id: string; name: string; color: number }

type Props = {
  system: StationSystem
  selected: boolean
  onSelect: () => void
  /** Teammates who have this system open right now (multiplayer only). */
  viewers?: readonly Viewer[]
  /** A split system in a crew: how many of its pieces are on this player's screen. */
  split?: { mine: number; total: number }
}

export default function SystemCard({ system, selected, onSelect, viewers = [], split }: Props) {
  const tag = STATUS_TAG[system.status]
  const locked = system.status === 'locked'

  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      aria-current={selected ? 'true' : undefined}
      className={`flex min-h-16 w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        selected
          ? 'border-nominal bg-nominal/8'
          : 'border-line bg-panel/60 enabled:hover:border-ink-muted/60'
      }`}
    >
      <span className="min-w-0">
        <span className="block truncate text-sm font-bold">{system.name}</span>
        <span className="font-display text-[11px] text-ink-muted">
          {locked
            ? isFinale(system)
              ? 'Restore every system to unlock'
              : 'Restore another system to unlock'
            : puzzleKindLabel(system.puzzle.kind)}
          {split && !locked && system.status === 'open' && (
            <span className="text-ink">
              {' '}
              · ◆{' '}
              {split.mine === 0
                ? 'Pieces on other screens'
                : `You hold ${split.mine} of ${split.total}`}
            </span>
          )}
        </span>
        {viewers.length > 0 && system.status === 'open' && (
          <span className="mt-1.5 flex flex-wrap gap-1">
            {viewers.map((viewer) => (
              <span
                key={viewer.id}
                className={`rounded px-1.5 py-0.5 font-display text-[10px] ${playerColor(viewer.color).tag}`}
              >
                {viewer.name}
              </span>
            ))}
            <span className="sr-only">{viewers.length === 1 ? 'is' : 'are'} working on this</span>
          </span>
        )}
      </span>
      <span
        className={`shrink-0 rounded-md px-2 py-1 font-display text-[10px] tracking-[0.08em] uppercase ${tag.className}`}
      >
        {tag.text}
      </span>
    </button>
  )
}
