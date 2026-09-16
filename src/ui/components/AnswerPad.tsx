import type { AnswerMode } from '../answer-input.ts'
import { usedTiles } from '../answer-input.ts'

type Props = {
  mode: Exclude<AnswerMode, 'text'>
  /** Only for tile pads: the scrambled word's letters. */
  tiles?: readonly string[]
  value: string
  onChange: (value: string) => void
}

const KEY =
  'flex min-h-12 items-center justify-center rounded-lg border border-line bg-panel/60 font-display text-lg font-bold enabled:hover:border-ink-muted/60 enabled:active:bg-panel-raised disabled:opacity-30'

const DIGITS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0']
const LETTERS = [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ']

/** Taps instead of a keyboard: the phone's own keyboard would cover the puzzle you're solving. */
export default function AnswerPad({ mode, tiles = [], value, onChange }: Props) {
  const add = (character: string) => onChange(value + character)
  const backspace = () => onChange(value.slice(0, -1))
  const used = mode === 'tiles' ? usedTiles(tiles, value) : []

  return (
    <div className="flex flex-col gap-2">
      {mode === 'digits' && (
        <div className="grid grid-cols-5 gap-2">
          {DIGITS.map((digit) => (
            <button key={digit} type="button" onClick={() => add(digit)} className={KEY}>
              {digit}
            </button>
          ))}
        </div>
      )}

      {mode === 'letters' && (
        <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-9">
          {LETTERS.map((letter) => (
            <button
              key={letter}
              type="button"
              onClick={() => add(letter)}
              className={`${KEY} text-base`}
            >
              {letter}
            </button>
          ))}
        </div>
      )}

      {mode === 'tiles' && (
        <div className="flex flex-wrap gap-2">
          {tiles.map((tile, index) => (
            <button
              key={index}
              type="button"
              disabled={used[index]}
              onClick={() => add(tile)}
              aria-label={used[index] ? `${tile}, already used` : `Add ${tile}`}
              className={`${KEY} w-12`}
            >
              {tile}
            </button>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={backspace}
        disabled={value.length === 0}
        aria-label="Delete the last character"
        className="min-h-11 self-start rounded-lg border border-line px-4 font-display text-xs text-ink-muted enabled:hover:text-ink disabled:opacity-40"
      >
        ⌫ Delete
      </button>
    </div>
  )
}
