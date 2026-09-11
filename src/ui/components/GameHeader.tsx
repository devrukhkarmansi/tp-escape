import type { AlertLevel } from '../../engine/game.ts'
import { describeClock, formatClock } from '../format.ts'
import { ALERT_STYLES } from '../labels.ts'

type Props = {
  stationName: string
  timeLeft: number
  level: AlertLevel
  solved: number
  total: number
}

export default function GameHeader({ stationName, timeLeft, level, solved, total }: Props) {
  const alert = ALERT_STYLES[level]

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-void/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 lg:px-8 lg:py-4">
        <div className="min-w-0">
          <p className="font-display text-[11px] font-bold tracking-[0.18em]">MAYDAY //</p>
          <p className="truncate font-display text-[11px] text-ink-muted">{stationName}</p>
        </div>

        <div className="flex items-center gap-3 sm:gap-5">
          <p
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-display text-[10px] tracking-[0.12em] uppercase ${alert.border} ${alert.text}`}
          >
            <span aria-hidden>{alert.icon}</span>
            {alert.label}
          </p>
          <p
            role="timer"
            aria-label={`${describeClock(timeLeft)} left`}
            className={`font-display text-2xl font-bold tabular-nums lg:text-3xl ${alert.text} ${level === 'critical' ? 'motion-safe:animate-pulse' : ''}`}
          >
            {formatClock(timeLeft)}
          </p>
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
