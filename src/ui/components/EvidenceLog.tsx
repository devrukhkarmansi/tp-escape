import type { EvidenceCard } from '../../engine/mystery.ts'
import { playerColor } from '../crew-ui.ts'
import { EVIDENCE_LABELS } from '../labels.ts'
import type { Viewer } from './SystemCard.tsx'

export type EvidenceEntry = {
  id: string
  systemName: string
  card: EvidenceCard
  /** Crew games: the teammate whose screen this card is on. Absent or null means it's yours. */
  holder?: Viewer | null
}

type Props = {
  /** Cards revealed so far, newest first. */
  cards: readonly EvidenceEntry[]
  total: number
}

/** The evidence each restored system has turned up. The finale is solved from these. */
export default function EvidenceLog({ cards, total }: Props) {
  return (
    <section aria-labelledby="evidence-log" className="mt-8">
      <h2
        id="evidence-log"
        className="mb-3 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase"
      >
        Evidence · {cards.length}/{total}
      </h2>
      {cards.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line px-4 py-3 text-sm text-ink-muted">
          Every system you restore turns up one piece of evidence.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {cards.map(({ id, systemName, card, holder }) => {
            const kind = EVIDENCE_LABELS[card.kind]
            return (
              <li
                key={id}
                className={`rounded-xl px-4 py-3 ${holder ? 'border border-dashed border-line' : 'border border-line bg-panel/40'}`}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-display text-[10px] tracking-[0.08em] uppercase ${
                      holder ? 'bg-ink-muted/15 text-ink-muted' : kind.className
                    }`}
                  >
                    {holder ? 'Sealed' : kind.label}
                  </span>
                  <span className="font-display text-[10px] text-ink-muted">from {systemName}</span>
                </span>
                {holder ? (
                  <span className="mt-1.5 block text-sm/6 text-ink-muted">
                    On{' '}
                    <span
                      className={`rounded px-1.5 py-0.5 font-display text-xs ${playerColor(holder.color).tag}`}
                    >
                      {holder.name}
                    </span>
                    ’s screen. Ask them to read it out.
                  </span>
                ) : (
                  <span className="mt-1.5 block text-sm/6">{card.text}</span>
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
