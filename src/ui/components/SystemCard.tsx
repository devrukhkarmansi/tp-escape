import type { StationSystem, SystemStatus } from '../../engine/game.ts'
import { puzzleKindLabel } from '../labels.ts'

const STATUS_TAG: Record<SystemStatus, { text: string; className: string }> = {
  open: { text: 'Open', className: 'bg-nominal/12 text-nominal' },
  solved: { text: '✓ Restored', className: 'bg-nominal/25 text-nominal' },
  locked: { text: 'Locked', className: 'bg-ink-muted/15 text-ink-muted' },
}

type Props = { system: StationSystem; selected: boolean; onSelect: () => void }

export default function SystemCard({ system, selected, onSelect }: Props) {
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
          {locked ? 'Restore another system to unlock' : puzzleKindLabel(system.puzzle.kind)}
        </span>
      </span>
      <span
        className={`shrink-0 rounded-md px-2 py-1 font-display text-[10px] tracking-[0.08em] uppercase ${tag.className}`}
      >
        {tag.text}
      </span>
    </button>
  )
}
