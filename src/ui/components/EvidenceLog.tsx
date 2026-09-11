import type { EvidenceCard } from '../../engine/mystery.ts'
import { EVIDENCE_LABELS } from '../labels.ts'

type Props = {
  /** Cards revealed so far, newest first. */
  cards: readonly { id: string; systemName: string; card: EvidenceCard }[]
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
          {cards.map(({ id, systemName, card }) => {
            const kind = EVIDENCE_LABELS[card.kind]
            return (
              <li key={id} className="rounded-xl border border-line bg-panel/40 px-4 py-3">
                <span className="flex items-center gap-2">
                  <span
                    className={`rounded px-1.5 py-0.5 font-display text-[10px] tracking-[0.08em] uppercase ${kind.className}`}
                  >
                    {kind.label}
                  </span>
                  <span className="font-display text-[10px] text-ink-muted">from {systemName}</span>
                </span>
                <span className="mt-1.5 block text-sm/6">{card.text}</span>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
