import { useState } from 'react'
import { DIFFICULTIES, type DifficultyId } from '../../engine/difficulty.ts'
import { isOnline, MAX_CREW, type Player } from '../../store/crew.ts'
import Backdrop from '../components/Backdrop.tsx'
import { playerColor } from '../crew-ui.ts'

type Props = {
  code: string
  players: readonly Player[]
  playerId: string
  hostId: string | null
  difficultyId: DifficultyId
  now: number
  launching: boolean
  onChangeDifficulty: (difficultyId: DifficultyId) => void
  onLaunch: () => void
  onLeave: () => void
}

const label = 'font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase'

export default function LobbyScreen({
  code,
  players,
  playerId,
  hostId,
  difficultyId,
  now,
  launching,
  onChangeDifficulty,
  onLaunch,
  onLeave,
}: Props) {
  const [copied, setCopied] = useState(false)
  const isHost = hostId === playerId
  const hostName = players.find((p) => p.id === hostId)?.name ?? 'the host'
  const difficulty = DIFFICULTIES.find((d) => d.id === difficultyId) ?? DIFFICULTIES[1]!
  const link = `${window.location.origin}/c/${code}`
  const crew = [...players].sort((a, b) => a.joinedAt - b.joinedAt)

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard needs https; on a local network address, the link stays selectable below.
      setCopied(false)
    }
  }

  return (
    <div className="relative isolate min-h-dvh">
      <Backdrop />
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col gap-8 px-5 pt-14 pb-10 lg:grid lg:max-w-5xl lg:grid-cols-2 lg:items-start lg:gap-16 lg:px-10 lg:pt-20">
        <section className="flex flex-col gap-6">
          <div>
            <p className={label}>Crew lobby</p>
            <h1 className="mt-3 text-2xl font-bold text-balance lg:text-3xl">
              Share this code with your crew
            </h1>
          </div>

          <p
            aria-label={`Crew code ${code.split('').join(' ')}`}
            className="rounded-2xl border border-dashed border-nominal/50 bg-nominal/5 py-6 text-center font-display text-5xl font-bold tracking-[0.3em] text-nominal"
          >
            {code}
          </p>

          <div className="flex flex-col gap-2">
            <span className={label}>Or send the link</span>
            <div className="flex gap-2">
              <input
                readOnly
                value={link}
                onFocus={(e) => e.target.select()}
                aria-label="Crew link"
                className="min-h-12 min-w-0 flex-1 rounded-xl border border-line bg-void/60 px-3 font-display text-xs text-ink-muted"
              />
              <button
                type="button"
                onClick={copyLink}
                className="min-h-12 shrink-0 rounded-xl border border-line px-4 text-sm font-bold hover:border-ink-muted/60"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6 lg:rounded-2xl lg:border lg:border-line lg:bg-panel/80 lg:p-8 lg:backdrop-blur">
          <div>
            <h2 className={label}>
              Crew · {players.length}/{MAX_CREW}
            </h2>
            <ul className="mt-3 flex flex-col gap-2">
              {crew.map((player) => {
                const online = isOnline(player, now)
                return (
                  <li
                    key={player.id}
                    className={`flex min-h-12 items-center gap-3 rounded-xl border border-line bg-panel/60 px-4 ${online ? '' : 'opacity-50'}`}
                  >
                    <span
                      aria-hidden
                      className={`size-2.5 shrink-0 rounded-full ${playerColor(player.color).dot}`}
                    />
                    <span className="min-w-0 flex-1 truncate text-sm font-bold">
                      {player.name}
                      {player.id === playerId && (
                        <span className="font-normal text-ink-muted"> (you)</span>
                      )}
                    </span>
                    {player.id === hostId && (
                      <span className="font-display text-[10px] tracking-[0.08em] text-nominal uppercase">
                        ★ Host
                      </span>
                    )}
                    {!online && (
                      <span className="font-display text-[10px] text-ink-muted uppercase">
                        Offline
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <span className={label}>Shift length</span>
            {isHost ? (
              <div className="grid grid-cols-3 gap-2">
                {DIFFICULTIES.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => onChangeDifficulty(tier.id)}
                    aria-pressed={tier.id === difficultyId}
                    className={`flex min-h-14 flex-col items-center justify-center rounded-xl border px-2 text-center ${
                      tier.id === difficultyId
                        ? 'border-nominal bg-nominal/5'
                        : 'border-line hover:border-ink-muted/60'
                    }`}
                  >
                    <span className="text-xs font-bold">{tier.name}</span>
                    <span className="font-display text-[10px] text-ink-muted">
                      {tier.minutes} min
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-line px-4 py-3 text-sm">
                <span className="font-bold">{difficulty.name}</span>{' '}
                <span className="font-display text-xs text-ink-muted">
                  · {difficulty.systems} systems · {difficulty.minutes} min
                </span>
              </p>
            )}
          </div>

          {isHost ? (
            <button
              type="button"
              onClick={onLaunch}
              disabled={launching}
              className="min-h-12 rounded-xl bg-nominal text-sm font-bold text-void hover:brightness-110 disabled:opacity-50"
            >
              {launching ? 'Launching…' : `Launch · ${difficulty.name}`}
            </button>
          ) : (
            <p className="flex min-h-12 items-center justify-center rounded-xl border border-dashed border-line px-4 text-center font-display text-xs text-ink-muted">
              Waiting for {hostName} to launch…
            </p>
          )}

          <button
            type="button"
            onClick={onLeave}
            className="min-h-11 font-display text-xs text-ink-muted underline-offset-4 hover:text-critical hover:underline"
          >
            Leave crew
          </button>
        </section>
      </main>
    </div>
  )
}
