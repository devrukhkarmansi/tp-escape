import type { AlertLevel } from '../../engine/game.ts'
import { describeClock, formatClock } from '../format.ts'
import { ALERT_STYLES } from '../labels.ts'
import { PauseIcon, PlayIcon, SoundOffIcon, SoundOnIcon } from './icons.tsx'

type Props = {
  stationName: string
  timeLeft: number
  level: AlertLevel
  solved: number
  total: number
  paused: boolean
  /** Solo: always. Crew: only the host, and it pauses everyone. */
  canPause: boolean
  onTogglePause: () => void
  soundOn: boolean
  onToggleSound: () => void
}

const iconButton =
  'flex size-11 shrink-0 items-center justify-center rounded-xl border border-line text-ink-muted hover:border-ink-muted/60 hover:text-ink'

export default function GameHeader({
  stationName,
  timeLeft,
  level,
  solved,
  total,
  paused,
  canPause,
  onTogglePause,
  soundOn,
  onToggleSound,
}: Props) {
  const alert = ALERT_STYLES[level]

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-3 sm:px-5 lg:px-8 lg:py-4">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold tracking-[0.18em]">MAYDAY //</p>
          <p className="truncate font-display text-[11px] text-ink-muted">{stationName}</p>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* On narrow phones only the icon shows; the word is still read out by screen readers. */}
          <p
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[10px] tracking-[0.12em] uppercase ${alert.border} ${alert.text}`}
          >
            <span aria-hidden>{alert.icon}</span>
            <span className="sr-only sm:not-sr-only">{alert.label}</span>
          </p>
          <p
            role="timer"
            aria-label={`${describeClock(timeLeft)} left${paused ? ', paused' : ''}`}
            className={`font-display text-2xl font-bold tabular-nums lg:text-3xl ${alert.text} ${
              paused ? 'opacity-50' : level === 'critical' ? 'motion-safe:animate-pulse' : ''
            }`}
          >
            {formatClock(timeLeft)}
          </p>
          {canPause && (
            <button
              type="button"
              onClick={onTogglePause}
              aria-label={paused ? 'Resume game' : 'Pause game'}
              className={iconButton}
            >
              {paused ? <PlayIcon /> : <PauseIcon />}
            </button>
          )}
          <button
            type="button"
            onClick={onToggleSound}
            aria-label="Sound"
            aria-pressed={soundOn}
            className={iconButton}
          >
            {soundOn ? <SoundOnIcon /> : <SoundOffIcon />}
          </button>
        </div>
      </div>

      <div
        role="progressbar"
        aria-label="Systems restored"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={solved}
        className="h-0.5 bg-line"
      >
        <div
          className="h-full bg-nominal transition-[width] duration-500"
          style={{ width: `${(solved / total) * 100}%` }}
        />
      </div>
    </header>
  )
}
