import { useState, type FormEvent } from 'react'
import { DIFFICULTIES, type DifficultyId } from '../../engine/difficulty.ts'
import { CREW_CODE_LENGTH, isCrewCode, normalizeCrewCode } from '../../store/crew.ts'
import Backdrop from '../components/Backdrop.tsx'
import { cleanName, MAX_NAME_LENGTH, rememberedName } from '../crew-ui.ts'

const BRIEFING = [
  '1–6 crew, on any phone or laptop',
  'New puzzles every run',
  'No accounts, just a crew code',
]

type Props = {
  onPlaySolo: (difficultyId: DifficultyId) => void
  /** Creates a crew and moves to its lobby. Rejects with a message if it can't. */
  onHost: (name: string, difficultyId: DifficultyId) => Promise<void>
  onJoin: (code: string, name: string) => void
}

type Mode = 'menu' | 'host' | 'join'

const input =
  'min-h-12 w-full rounded-xl border border-line bg-void/60 px-4 font-display text-base tracking-wide'
const label = 'font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase'
const primary =
  'min-h-12 rounded-xl bg-nominal text-sm font-bold text-void hover:brightness-110 disabled:opacity-50'
const secondary =
  'min-h-12 rounded-xl border border-line text-sm font-bold hover:border-ink-muted/60'

export default function HomeScreen({ onPlaySolo, onHost, onJoin }: Props) {
  const [shift, setShift] = useState<DifficultyId>('full')
  const [mode, setMode] = useState<Mode>('menu')
  const [name, setName] = useState(rememberedName)
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  async function host(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleaned = cleanName(name)
    if (!cleaned) return setError('Enter a name so your crew knows who you are.')
    setBusy(true)
    setError(null)
    try {
      await onHost(cleaned, shift)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the crew. Please try again.')
      setBusy(false)
    }
  }

  function join(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const crewCode = normalizeCrewCode(code)
    const cleaned = cleanName(name)
    if (!isCrewCode(crewCode)) {
      return setError(`Crew codes are ${CREW_CODE_LENGTH} letters and numbers, like K7QXM.`)
    }
    if (!cleaned) return setError('Enter a name so your crew knows who you are.')
    onJoin(crewCode, cleaned)
  }

  const nameField = (
    <label className="flex flex-col gap-2">
      <span className={label}>Your name</span>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={MAX_NAME_LENGTH}
        autoComplete="nickname"
        placeholder="e.g. Ravi"
        className={input}
      />
    </label>
  )

  return (
    <div className="relative isolate min-h-dvh">
      <Backdrop />

      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-10 px-5 pt-16 pb-10 lg:grid lg:max-w-5xl lg:grid-cols-[1.15fr_1fr] lg:items-center lg:gap-20 lg:px-10 lg:py-16">
        <header className="text-center lg:text-left">
          <p className="font-display text-[11px] tracking-[0.18em] text-ink-muted uppercase lg:text-xs">
            Kepler-9 relay · distress channel
          </p>
          <h1 className="mt-4 font-display text-3xl font-bold tracking-wide text-balance lg:mt-6 lg:text-6xl lg:leading-[1.05]">
            MAYDAY PROTOCOL
          </h1>
          <p className="mt-3 text-sm/6 text-balance text-ink-muted lg:mt-6 lg:max-w-md lg:text-lg/8">
            A co-op escape room for 1–6 players. Get your crew off the station before the module
            purges.
          </p>
          <ul className="mt-10 hidden flex-col gap-3 lg:flex">
            {BRIEFING.map((line) => (
              <li
                key={line}
                className="flex items-center gap-3 font-display text-xs tracking-wide text-ink-muted"
              >
                <span aria-hidden className="size-1.5 rounded-full bg-nominal" />
                {line}
              </li>
            ))}
          </ul>
        </header>

        <section
          aria-label="Start a game"
          className="flex flex-1 flex-col gap-8 lg:flex-none lg:rounded-2xl lg:border lg:border-line lg:bg-panel/80 lg:p-8 lg:shadow-2xl lg:shadow-black/40 lg:backdrop-blur"
        >
          {mode !== 'join' && (
            <fieldset className="flex flex-col gap-2">
              <legend className={`mb-2 ${label}`}>Shift length</legend>
              {DIFFICULTIES.map((tier) => (
                <label
                  key={tier.id}
                  className="flex min-h-14 cursor-pointer items-center justify-between rounded-xl border border-line px-4 transition-colors hover:border-ink-muted/60 has-checked:border-nominal has-checked:bg-nominal/5 has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-nominal"
                >
                  <input
                    type="radio"
                    name="shift"
                    value={tier.id}
                    checked={shift === tier.id}
                    onChange={() => setShift(tier.id)}
                    className="sr-only"
                  />
                  <span>
                    <span className="block text-sm font-bold">{tier.name}</span>
                    <span className="font-display text-[11px] text-ink-muted">
                      {tier.systems} systems
                    </span>
                  </span>
                  <span className="font-display text-xs text-ink-muted tabular-nums">
                    {tier.minutes} min
                  </span>
                </label>
              ))}
            </fieldset>
          )}

          {mode === 'menu' && (
            <div className="mt-auto flex flex-col gap-3 lg:mt-0">
              <button type="button" onClick={() => onPlaySolo(shift)} className={primary}>
                Play solo
              </button>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => switchMode('host')} className={secondary}>
                  Host a crew
                </button>
                <button type="button" onClick={() => switchMode('join')} className={secondary}>
                  Join with code
                </button>
              </div>
            </div>
          )}

          {mode === 'host' && (
            <form onSubmit={host} className="mt-auto flex flex-col gap-4 lg:mt-0">
              {nameField}
              <button type="submit" disabled={busy} className={primary}>
                {busy ? 'Creating crew…' : 'Create crew'}
              </button>
              <button type="button" onClick={() => switchMode('menu')} className={secondary}>
                Back
              </button>
            </form>
          )}

          {mode === 'join' && (
            <form onSubmit={join} className="mt-auto flex flex-col gap-4 lg:mt-0">
              <label className="flex flex-col gap-2">
                <span className={label}>Crew code</span>
                <input
                  value={code}
                  onChange={(e) => setCode(normalizeCrewCode(e.target.value))}
                  maxLength={CREW_CODE_LENGTH}
                  autoCapitalize="characters"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="K7QXM"
                  className={`${input} text-center text-2xl tracking-[0.3em] uppercase`}
                />
              </label>
              {nameField}
              <button type="submit" className={primary}>
                Join crew
              </button>
              <button type="button" onClick={() => switchMode('menu')} className={secondary}>
                Back
              </button>
            </form>
          )}

          {error && (
            <p role="alert" className="font-display text-xs text-critical">
              {error}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}
