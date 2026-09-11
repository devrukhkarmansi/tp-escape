import { useEffect, useState } from 'react'
import { alertLevel, OPEN_AT_ONCE, timeLeftMs } from '../../engine/game.ts'
import type { GameStore } from '../../store/game-store.ts'
import Backdrop from '../components/Backdrop.tsx'
import GameHeader from '../components/GameHeader.tsx'
import SystemCard from '../components/SystemCard.tsx'
import SystemPanel from '../components/SystemPanel.tsx'
import { useGame } from '../hooks/use-game.ts'
import { useNow } from '../hooks/use-now.ts'
import { SOLO_PLAYER_ID, THEME } from '../solo-game.ts'
import DebriefScreen from './DebriefScreen.tsx'

type Props = { store: GameStore; onPlayAgain: () => void; onExit: () => void }

export default function GameScreen({ store, onPlayAgain, onExit }: Props) {
  const game = useGame(store)
  const playing = game.status === 'playing'
  const now = useNow(playing ? 250 : null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // The engine never reads the clock, so the screen tells it when time has run out.
  useEffect(() => {
    if (playing && now >= game.endsAt) store.dispatch({ type: 'tick', at: now })
  }, [playing, now, game.endsAt, store])

  if (!playing) return <DebriefScreen game={game} onPlayAgain={onPlayAgain} onHome={onExit} />

  const level = alertLevel(game, now)
  const selected = game.systems.find((s) => s.id === selectedId)
  const solved = game.systems.filter((s) => s.status === 'solved').length

  function select(id: string | null) {
    setSelectedId(id)
    window.scrollTo({ top: 0 })
  }

  function abandon() {
    if (window.confirm('Abandon this mission? This game will be lost.')) onExit()
  }

  return (
    <div data-alert={level} className="relative isolate min-h-dvh">
      <Backdrop />
      <GameHeader
        stationName={THEME.name}
        timeLeft={timeLeftMs(game, now)}
        level={level}
        solved={solved}
        total={game.systems.length}
      />

      <main className="mx-auto w-full max-w-6xl px-5 pt-6 pb-12 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-8 lg:pt-8">
        {/* Phones show the list or one system; laptops show both side by side. */}
        <nav aria-label="Station systems" className={selected ? 'hidden lg:block' : undefined}>
          <h2 className="mb-3 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
            Station systems · {solved}/{game.systems.length} restored
          </h2>
          <ul className="flex flex-col gap-2">
            {game.systems.map((system) => (
              <li key={system.id}>
                <SystemCard
                  system={system}
                  selected={system.id === selectedId}
                  onSelect={() => select(system.id)}
                />
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={abandon}
            className="mt-6 min-h-11 font-display text-xs text-ink-muted underline-offset-4 hover:text-critical hover:underline"
          >
            Abandon mission
          </button>
        </nav>

        {selected ? (
          <SystemPanel
            key={selected.id}
            system={selected}
            onBack={() => select(null)}
            onSubmit={(answer) =>
              store.dispatch({
                type: 'submit',
                systemId: selected.id,
                answer,
                playerId: SOLO_PLAYER_ID,
                at: Date.now(),
              })
            }
            onHint={() => store.dispatch({ type: 'hint', systemId: selected.id, at: Date.now() })}
          />
        ) : (
          <div className="hidden min-h-80 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line p-8 text-center lg:flex">
            <p className="font-display text-sm text-ink">Select a system to start repairs</p>
            <p className="max-w-xs text-sm text-ink-muted">
              Up to {OPEN_AT_ONCE} systems are open at a time. Restoring one brings the next one
              online.
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
