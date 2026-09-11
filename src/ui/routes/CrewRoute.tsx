import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router'
import { signIn } from '../../firebase/app.ts'
import { createCrewStore } from '../../store/crew-store.ts'
import {
  electHost,
  isCrewCode,
  MAX_CREW,
  normalizeCrewCode,
  type Player,
} from '../../store/crew.ts'
import {
  applyRemoteAction,
  backToLobby,
  heartbeat,
  joinCrew,
  launchGame,
  setDifficulty,
  setViewing,
  watchPlayers,
  watchRoom,
  type Room,
} from '../../store/room.ts'
import Backdrop from '../components/Backdrop.tsx'
import { cleanName, MAX_NAME_LENGTH, rememberedName, rememberName } from '../crew-ui.ts'
import { useNow } from '../hooks/use-now.ts'
import GameScreen from '../screens/GameScreen.tsx'
import LobbyScreen from '../screens/LobbyScreen.tsx'
import { newGame } from '../solo-game.ts'

const HEARTBEAT_MS = 30_000

/** /c/:code — the crew's lobby, then its shared game. */
export default function CrewRoute() {
  const params = useParams()
  const code = normalizeCrewCode(params.code ?? '')
  const navigate = useNavigate()
  const joinAs = (useLocation().state as { joinAs?: string } | null)?.joinAs

  const [uid, setUid] = useState<string | null>(null)
  const [room, setRoom] = useState<Room | null | undefined>(undefined)
  const [players, setPlayers] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [joinState, setJoinState] = useState<'idle' | 'joining' | 'full'>('idle')
  const [launching, setLaunching] = useState(false)
  const [offsetMs, setOffsetMs] = useState(0)
  const bestRoundTrip = useRef(Number.POSITIVE_INFINITY)

  // This device's clock, corrected to Firestore's, so every phone's timer matches.
  const clock = useCallback(() => Date.now() + offsetMs, [offsetMs])
  const now = useNow(5_000, clock)
  const report = useCallback(
    (e: unknown) => setError(e instanceof Error ? e.message : String(e)),
    [],
  )

  // Sign in, then follow the room and its players live.
  useEffect(() => {
    if (!isCrewCode(code)) return
    let stopped = false
    const unsubscribes: Array<() => void> = []
    signIn().then((id) => {
      if (stopped) return
      setUid(id)
      unsubscribes.push(watchRoom(code, setRoom, report), watchPlayers(code, setPlayers, report))
    }, report)
    return () => {
      stopped = true
      for (const unsubscribe of unsubscribes) unsubscribe()
    }
  }, [code, report])

  const isMember = !!uid && !!room && room.playerUids.includes(uid)

  // Heartbeat every 30 s (and on returning to the tab): shows you as online, and measures the
  // clock offset. The sample with the fastest round trip is the most accurate, so keep that one.
  useEffect(() => {
    if (!isMember || !uid) return
    let stopped = false
    const beat = () =>
      heartbeat(code, uid).then(
        (sample) => {
          if (stopped || sample.roundTripMs > bestRoundTrip.current) return
          bestRoundTrip.current = sample.roundTripMs
          setOffsetMs(Math.round(sample.offsetMs))
        },
        () => {
          // A missed heartbeat only means "offline" for a moment.
        },
      )
    void beat()
    const id = setInterval(beat, HEARTBEAT_MS)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void beat()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      stopped = true
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [isMember, uid, code])

  const join = useCallback(
    async (name: string) => {
      setJoinState('joining')
      try {
        const result = await joinCrew(code, name)
        if (result === 'missing') setRoom(null)
        setJoinState(result === 'full' ? 'full' : 'idle')
      } catch (e) {
        report(e)
        setJoinState('idle')
      }
    },
    [code, report],
  )

  // Arriving from "Join with code" with a name already typed: join straight away.
  const autoJoined = useRef(false)
  useEffect(() => {
    if (!joinAs || autoJoined.current || !uid || !room || isMember) return
    autoJoined.current = true
    void join(joinAs)
  }, [joinAs, uid, room, isMember, join])

  // One store per round. Later snapshots of the same round go to receive(), not a new store.
  const playing = room?.status === 'playing' && !!room.game
  const round = room?.round ?? 0
  const initialGame = room?.game ?? null
  const store = useMemo(
    () =>
      playing && initialGame
        ? createCrewStore(initialGame, (action) => applyRemoteAction(code, action), report)
        : null,
    // initialGame is read only when a round starts; including it would rebuild the store on
    // every snapshot and lose the local optimistic state.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [playing, round, code, report],
  )
  useEffect(() => {
    if (store && room?.game) store.receive(room.game)
  }, [store, room])

  // A new round starts with nobody "looking at" a system from the last one.
  useEffect(() => {
    if (store && uid) setViewing(code, uid, null).catch(() => {})
  }, [store, uid, code])

  const hostId = electHost(players, now)

  function leave() {
    if (uid && isMember) setViewing(code, uid, null).catch(() => {})
    navigate('/')
  }

  async function launch() {
    if (!room) return
    setLaunching(true)
    try {
      await launchGame(code, newGame(room.difficultyId, clock()))
    } catch (e) {
      report(e)
    } finally {
      setLaunching(false)
    }
  }

  if (error) return <Notice title="Lost contact with the station" body={error} />
  if (!isCrewCode(code) || room === null) {
    return (
      <Notice
        title="No crew with that code"
        body={`Check the code${code ? ` (${code})` : ''} with whoever is hosting, or host your own crew.`}
      />
    )
  }
  if (!uid || room === undefined) return <Notice title="Connecting to the station…" />

  if (!isMember) {
    if (joinState === 'full' || room.playerUids.length >= MAX_CREW) {
      return (
        <Notice title="This crew is full" body={`A crew can have up to ${MAX_CREW} players.`} />
      )
    }
    return (
      <JoinPanel
        code={code}
        busy={joinState === 'joining'}
        onJoin={(name) => {
          rememberName(name)
          void join(name)
        }}
      />
    )
  }

  if (store) {
    return (
      <GameScreen
        key={round}
        store={store}
        playerId={uid}
        clock={clock}
        crew={{
          players,
          hostId,
          onView: (systemId) => setViewing(code, uid, systemId).catch(() => {}),
        }}
        onPlayAgain={() => backToLobby(code).catch(report)}
        onExit={leave}
      />
    )
  }

  return (
    <LobbyScreen
      code={code}
      players={players}
      playerId={uid}
      hostId={hostId}
      difficultyId={room.difficultyId}
      now={now}
      launching={launching}
      onChangeDifficulty={(difficultyId) => setDifficulty(code, difficultyId).catch(report)}
      onLaunch={launch}
      onLeave={leave}
    />
  )
}

function Notice({ title, body }: { title: string; body?: string }) {
  return (
    <div className="relative isolate min-h-dvh">
      <Backdrop />
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col items-center justify-center gap-4 px-5 text-center">
        <h1 className="font-display text-xl font-bold text-balance">{title}</h1>
        {body && <p className="text-sm/6 text-balance text-ink-muted">{body}</p>}
        <a
          href="/"
          className="mt-4 flex min-h-12 w-full items-center justify-center rounded-xl border border-line text-sm font-bold hover:border-ink-muted/60"
        >
          Back to home
        </a>
      </main>
    </div>
  )
}

function JoinPanel({
  code,
  busy,
  onJoin,
}: {
  code: string
  busy: boolean
  onJoin: (name: string) => void
}) {
  const [name, setName] = useState(rememberedName)
  const [problem, setProblem] = useState<string | null>(null)

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleaned = cleanName(name)
    if (!cleaned) return setProblem('Enter a name so your crew knows who you are.')
    onJoin(cleaned)
  }

  return (
    <div className="relative isolate min-h-dvh">
      <Backdrop />
      <main className="mx-auto flex min-h-dvh w-full max-w-sm flex-col justify-center gap-6 px-5">
        <div className="text-center">
          <p className="font-display text-[11px] tracking-[0.18em] text-ink-muted uppercase">
            Joining crew
          </p>
          <p className="mt-3 font-display text-4xl font-bold tracking-[0.3em] text-nominal">
            {code}
          </p>
        </div>
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
              Your name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={MAX_NAME_LENGTH}
              autoComplete="nickname"
              placeholder="e.g. Ravi"
              className="min-h-12 w-full rounded-xl border border-line bg-void/60 px-4 font-display text-base tracking-wide"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="min-h-12 rounded-xl bg-nominal text-sm font-bold text-void hover:brightness-110 disabled:opacity-50"
          >
            {busy ? 'Joining…' : 'Join crew'}
          </button>
          {problem && (
            <p role="alert" className="font-display text-xs text-critical">
              {problem}
            </p>
          )}
        </form>
      </main>
    </div>
  )
}
