import type { StoryBeat } from '../../engine/story.ts'
import type { Transmission } from '../../engine/theme.ts'
import { BEAT_LABELS } from '../labels.ts'

type Props = {
  entries: readonly { beat: StoryBeat; transmission: Transmission }[]
  onOpen: (beat: StoryBeat) => void
}

/** Every transmission so far, newest first, so nobody misses the story. */
export default function TransmissionLog({ entries, onOpen }: Props) {
  if (entries.length === 0) return null

  return (
    <section aria-labelledby="transmission-log" className="mt-8">
      <h2
        id="transmission-log"
        className="mb-3 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase"
      >
        Transmissions
      </h2>
      <ul className="flex flex-col gap-2">
        {[...entries].reverse().map(({ beat, transmission }) => (
          <li key={beat}>
            <button
              type="button"
              onClick={() => onOpen(beat)}
              className="w-full rounded-xl border border-line bg-panel/40 px-4 py-3 text-left hover:border-ink-muted/60"
            >
              <span className="block font-display text-[10px] tracking-[0.12em] text-ink-muted uppercase">
                {BEAT_LABELS[beat]} · {transmission.from}
              </span>
              <span className="mt-1 block truncate text-sm">{transmission.lines[0]}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}
