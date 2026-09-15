import { useEffect, useState } from 'react'
import { MORSE } from '../../engine/puzzles/morse.ts'
import { morseSteps } from '../morse-timing.ts'
import { playMorse } from '../sound.ts'

type Props = { code: string; showText: boolean; chart?: boolean }

/** A beacon that blinks the signal on a loop; a button beeps it once. Includes a Morse chart unless it's elsewhere. */
export default function MorseBeacon({ code, showText, chart = true }: Props) {
  const [lit, setLit] = useState(false)

  useEffect(() => {
    const steps = morseSteps(code)
    let index = 0
    let timer: ReturnType<typeof setTimeout>
    const next = () => {
      const step = steps[index]!
      setLit(step.on)
      index = (index + 1) % steps.length
      timer = setTimeout(next, step.ms)
    }
    timer = setTimeout(next, 400)
    return () => clearTimeout(timer)
  }, [code])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-center gap-6 rounded-xl border border-line bg-void/60 px-5 py-6">
        <span
          aria-hidden
          className={`size-14 rounded-full border-2 transition-[background-color,box-shadow] duration-75 ${
            lit
              ? 'border-caution bg-caution shadow-[0_0_28px_6px] shadow-caution/60'
              : 'border-line bg-panel'
          }`}
        />
        <button
          type="button"
          onClick={() => playMorse(morseSteps(code).slice(0, -1))}
          className="min-h-11 rounded-lg border border-line px-4 font-display text-xs hover:border-ink-muted/60"
        >
          ▶ Play the beeps
        </button>
      </div>

      {showText && (
        <p
          aria-label={`Signal: ${code.split(' ').join(', then ')}`}
          className="text-center font-display text-2xl tracking-[0.25em] break-words"
        >
          {code.split(' ').join('  /  ')}
        </p>
      )}

      {chart && <MorseChart />}
    </div>
  )
}

/** Every letter's dots and dashes. Its own component so a split puzzle can put it on another screen. */
export function MorseChart() {
  return (
    <details className="rounded-xl border border-line px-4 py-3" open>
      <summary className="cursor-pointer font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
        Morse chart
      </summary>
      <dl className="mt-3 grid grid-cols-4 gap-x-3 gap-y-1.5 font-display text-xs sm:grid-cols-6">
        {Object.entries(MORSE).map(([letter, signal]) => (
          <div key={letter} className="flex justify-between gap-2">
            <dt className="font-bold">{letter}</dt>
            <dd className="tracking-widest text-ink-muted">{signal}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
