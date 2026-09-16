import { useCallback, useEffect, useRef, useState } from 'react'
import {
  alertLevel,
  isFinale,
  isPaused,
  OPEN_AT_ONCE,
  timeLeftMs,
  type GameState,
  type StationSystem,
} from '../../engine/game.ts'
import { beatsDue, transmissionFor, type StoryBeat } from '../../engine/story.ts'
import type { Transmission } from '../../engine/theme.ts'
import { isOnline, type Player } from '../../store/crew.ts'
import type { GameStore } from '../../store/game-store.ts'
import Backdrop from '../components/Backdrop.tsx'
import EvidenceLog from '../components/EvidenceLog.tsx'
import FinalePanel from '../components/FinalePanel.tsx'
import GameHeader from '../components/GameHeader.tsx'
import PausedPanel from '../components/PausedPanel.tsx'
import type { PieceView } from '../components/PuzzlePieces.tsx'
import SystemCard, { type Viewer } from '../components/SystemCard.tsx'
import SystemPanel from '../components/SystemPanel.tsx'
import Toast from '../components/Toast.tsx'
import TransmissionLog from '../components/TransmissionLog.tsx'
import TransmissionOverlay from '../components/TransmissionOverlay.tsx'
import { formatClock } from '../format.ts'
import { useGame } from '../hooks/use-game.ts'
import { useNow } from '../hooks/use-now.ts'
import { useSoundSetting } from '../hooks/use-sound-setting.ts'
import { evidenceHolders, piecesFor } from '../pieces.ts'
import { THEME } from '../solo-game.ts'
import {
  playAlert,
  playLaunch,
  playSolved,
  playTick,
  playTimeUp,
  playTransmission,
  playWrong,
} from '../sound.ts'
import { loadSeenBeats, saveSeenBeats } from '../story-seen.ts'
import DebriefScreen from './DebriefScreen.tsx'

const FINAL_MINUTE_MS = 60_000
const URGENT_SECONDS = 10

/** What a crew game adds on top of solo play. */
export type CrewSession = {
  players: readonly Player[]
  hostId: string | null
  onView: (systemId: string | null) => void
}

type Props = {
  store: GameStore
  playerId: string
  /** Solo uses this device's clock; a crew uses Firestore's, so every timer matches. */
  clock?: () => number
  crew?: CrewSession
  onPlayAgain: () => void
  onExit: () => void
}

export default function GameScreen({
  store,
  playerId,
  clock = Date.now,
  crew,
  onPlayAgain,
  onExit,
}: Props) {
  const game = useGame(store)
  const playing = game.status === 'playing'
  const paused = isPaused(game)
  const now = useNow(playing ? 250 : null, clock)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useSoundSetting()
  const [toasts, setToasts] = useState<{ id: string; text: string }[]>([])
  const dismissToast = useCallback(
    (id: string) => setToasts((current) => current.filter((t) => t.id !== id)),
    [],
  )

  const isHost = !crew || crew.hostId === playerId
  const hostName = crew?.players.find((p) => p.id === crew.hostId)?.name
  const nameOf = (id: string | undefined) =>
    crew?.players.find((p) => p.id === id)?.name ?? 'A teammate'

  const timeLeft = timeLeftMs(game, now)
  const secondsLeft = Math.ceil(timeLeft / 1000)
  const finalMinute = playing && !paused && timeLeft > 0 && timeLeft <= FINAL_MINUTE_MS

  // Story: the clock decides which transmissions have played (the same on every phone); this
  // device only remembers which ones it has already shown.
  const gameKey = `${game.seed}-${game.startedAt}`
  const due = beatsDue(game, now)
  const [seenBeats, setSeenBeats] = useState<StoryBeat[]>(() => loadSeenBeats(gameKey))
  const [reopened, setReopened] = useState<StoryBeat | null>(null)
  const unseen = due.filter((beat) => !seenBeats.includes(beat))
  const newestUnseen = unseen.at(-1) ?? null
  const showing = reopened ?? newestUnseen

  useEffect(() => {
    if (newestUnseen && soundOn) playTransmission()
  }, [newestUnseen, soundOn])

  function closeTransmission() {
    if (unseen.length > 0) {
      const next = [...seenBeats, ...unseen]
      setSeenBeats(next)
      saveSeenBeats(gameKey, next)
    }
    setReopened(null)
  }

  // The engine never reads the clock, so the screen tells it when time has run out.
  useEffect(() => {
    if (playing && !paused && now >= game.endsAt) store.dispatch({ type: 'tick', at: now })
  }, [playing, paused, now, game.endsAt, store])

  // One tick per second through the final minute; runs each time the displayed second changes.
  useEffect(() => {
    if (finalMinute && soundOn) playTick(secondsLeft <= URGENT_SECONDS)
  }, [finalMinute, soundOn, secondsLeft])

  // The alarm and the launch sting each play once, as the game ends.
  const previousStatus = useRef(game.status)
  useEffect(() => {
    if (previousStatus.current === 'playing' && soundOn) {
      if (game.status === 'lost') playTimeUp()
      if (game.status === 'won') playLaunch()
    }
    previousStatus.current = game.status
  }, [game.status, soundOn])

  // A chime each time the station drops to a worse alert level, so nobody has to watch the clock.
  const level = alertLevel(game, now)
  const previousLevel = useRef(level)
  useEffect(() => {
    if (level !== previousLevel.current && level !== 'nominal' && playing && soundOn) {
      playAlert(level === 'critical')
    }
    previousLevel.current = level
  }, [level, playing, soundOn])

  // In a crew, say when a teammate restores a system.
  const seenSolved = useRef(
    new Set(game.systems.filter((s) => s.status === 'solved').map((s) => s.id)),
  )
  useEffect(() => {
    const newlySolved = game.systems.filter(
      (s) => s.status === 'solved' && !seenSolved.current.has(s.id),
    )
    for (const system of newlySolved) seenSolved.current.add(system.id)
    if (newlySolved.length > 0 && soundOn) playSolved()
    if (!crew) return
    const byOthers = newlySolved.filter((s) => s.solvedBy && s.solvedBy !== playerId)
    if (byOthers.length === 0) return
    const names = new Map(crew.players.map((p) => [p.id, p.name]))
    setToasts((current) => [
      ...current,
      ...byOthers.map((s) => ({
        id: `${s.id}-${s.solvedAt}`,
        text: `${names.get(s.solvedBy!) ?? 'A teammate'} restored ${s.name}`,
      })),
    ])
  }, [game.systems, crew, playerId, soundOn])

  if (!playing) {
    return (
      <DebriefScreen
        game={game}
        onPlayAgain={onPlayAgain}
        onHome={onExit}
        canPlayAgain={isHost}
        hostName={hostName}
        solverName={crew ? nameOf : undefined}
        crewSize={crew?.players.length ?? 1}
        homeLabel={crew ? 'Leave crew' : 'Back to home'}
      />
    )
  }

  const selected = game.systems.find((s) => s.id === selectedId)
  const piecesOf = (system: StationSystem) =>
    piecesFor(game, game.systems.indexOf(system), playerId, crew?.players, now)
  const solved = game.systems.filter((s) => s.status === 'solved').length

  const viewersBySystem = new Map<string, Viewer[]>()
  for (const player of crew?.players ?? []) {
    if (player.id === playerId || !player.viewing || !isOnline(player, now)) continue
    const list = viewersBySystem.get(player.viewing) ?? []
    list.push({ id: player.id, name: player.name, color: player.color })
    viewersBySystem.set(player.viewing, list)
  }

  function select(id: string | null) {
    setSelectedId(id)
    crew?.onView(id)
    window.scrollTo({ top: 0 })
  }

  function togglePause() {
    if (!isHost) return
    store.dispatch({ type: paused ? 'resume' : 'pause', at: clock() })
  }

  const exitLabel = crew ? 'Leave crew' : 'Abandon mission'
  function exit() {
    const question = crew
      ? 'Leave the crew? The game carries on without you, and you can come back with the same link.'
      : 'Abandon this mission? This game will be lost.'
    if (window.confirm(question)) onExit()
  }

  return (
    <div data-alert={level} className="relative isolate min-h-dvh">
      <Backdrop />
      {finalMinute && (
        <div
          aria-hidden
          className="pointer-events-none fixed inset-0 -z-10 bg-emergency-vignette motion-safe:animate-emergency"
        />
      )}
      <GameHeader
        stationName={THEME.name}
        timeLeft={timeLeft}
        level={level}
        solved={solved}
        total={game.systems.length}
        paused={paused}
        canPause={isHost}
        onTogglePause={togglePause}
        soundOn={soundOn}
        onToggleSound={() => setSoundOn(!soundOn)}
      />

      {paused ? (
        <PausedPanel
          timeLeft={timeLeft}
          canResume={isHost}
          hostName={crew ? hostName : undefined}
          onResume={togglePause}
          onExit={exit}
          exitLabel={exitLabel}
        />
      ) : (
        <main className="mx-auto w-full max-w-6xl px-5 pt-6 pb-12 lg:grid lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-8 lg:pt-8">
          {finalMinute && (
            <p
              role="alert"
              className="mb-4 rounded-xl border border-critical/60 bg-critical/10 px-4 py-3 font-display text-xs text-critical lg:col-span-2"
            >
              ■ HALCYON: Final minute. Module purge imminent.
            </p>
          )}

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
                    viewers={viewersBySystem.get(system.id)}
                    split={splitSummary(piecesOf(system))}
                  />
                </li>
              ))}
            </ul>
            <EvidenceLog
              cards={revealedEvidence(game, evidenceHolders(game, playerId, crew?.players, now))}
              total={game.mystery.evidence.length}
            />
            <TransmissionLog
              entries={due.map((beat) => ({ beat, transmission: storyText(game, beat) }))}
              onOpen={setReopened}
            />
            <button
              type="button"
              onClick={exit}
              className="mt-6 min-h-11 font-display text-xs text-ink-muted underline-offset-4 hover:text-critical hover:underline"
            >
              {exitLabel}
            </button>
          </nav>

          {selected && isFinale(selected) && selected.status === 'open' ? (
            <FinalePanel
              key={selected.id}
              system={selected}
              mystery={game.mystery}
              suspects={THEME.mystery.suspects}
              codeSystems={codeSystemsFor(game, selected)}
              onOpenSystem={select}
              onBack={() => select(null)}
              onAccuse={(suspectId, code) =>
                store.dispatch({ type: 'accuse', suspectId, code, playerId, at: clock() })
              }
              onHint={() => store.dispatch({ type: 'hint', systemId: selected.id, at: clock() })}
              onWrong={() => soundOn && playWrong()}
            />
          ) : selected ? (
            <SystemPanel
              key={selected.id}
              system={selected}
              pieces={piecesOf(selected)}
              solverName={crew && selected.solvedBy ? nameOf(selected.solvedBy) : undefined}
              onBack={() => select(null)}
              onSubmit={(answer) =>
                store.dispatch({
                  type: 'submit',
                  systemId: selected.id,
                  answer,
                  playerId,
                  at: clock(),
                })
              }
              onHint={() => store.dispatch({ type: 'hint', systemId: selected.id, at: clock() })}
              onWrong={() => soundOn && playWrong()}
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
      )}

      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-4 z-30 flex flex-col items-center gap-2 px-4"
      >
        {toasts.map((toast) => (
          <Toast key={toast.id} id={toast.id} text={toast.text} onDone={dismissToast} />
        ))}
      </div>

      {showing && (
        <TransmissionOverlay
          key={showing}
          beat={showing}
          transmission={storyText(game, showing)}
          onClose={closeTransmission}
        />
      )}
    </div>
  )
}

/** For the board: how many of a split system's pieces you hold, once they're really shared out. */
function splitSummary(pieces: readonly PieceView[] | undefined) {
  if (!pieces?.some((p) => p.holder)) return undefined
  return { mine: pieces.filter((p) => !p.holder).length, total: pieces.length }
}

/**
 * Evidence from restored systems, newest first. Card i belongs to system i (board order).
 * In a crew, each card is dealt to one player; the rest see who has it.
 */
function revealedEvidence(game: GameState, holders: (Viewer | null)[] | undefined) {
  return game.systems
    .flatMap((system, index) => {
      const card = game.mystery.evidence[index]
      return card && !isFinale(system) && system.status === 'solved'
        ? [
            {
              id: system.id,
              systemName: system.name,
              card,
              holder: holders?.[index] ?? null,
              at: system.solvedAt ?? 0,
            },
          ]
        : []
    })
    .sort((a, b) => b.at - a.at)
}

/** The systems named in the launch code, in code order. */
function codeSystemsFor(game: GameState, escapePod: StationSystem) {
  const names = escapePod.puzzle.display?.split('  ·  ') ?? []
  return names.flatMap((name) => {
    const system = game.systems.find((s) => s.name === name)
    return system ? [{ id: system.id, name, restored: system.status === 'solved' }] : []
  })
}

/** This game's version of a story moment, with `{time}` filled in as the shift length. */
function storyText(game: GameState, beat: StoryBeat): Transmission {
  const transmission = transmissionFor(game, THEME, beat)
  const time = formatClock(game.durationMs)
  return {
    ...transmission,
    lines: transmission.lines.map((line) => line.replaceAll('{time}', time)),
  }
}
