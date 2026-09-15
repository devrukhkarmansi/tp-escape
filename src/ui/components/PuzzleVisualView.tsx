import type { PuzzleVisual } from '../../engine/puzzle.ts'
import GaugeDial from './GaugeDial.tsx'
import GlyphSymbol from './GlyphSymbol.tsx'
import MorseBeacon, { MorseChart } from './MorseBeacon.tsx'

/** Draws the puzzles that need a picture rather than text. */
export default function PuzzleVisualView({ visual }: { visual: PuzzleVisual }) {
  switch (visual.type) {
    case 'glyphs':
      // A split glyph puzzle has the inscription on one screen and the key on another.
      return (
        <div className="flex flex-col gap-4">
          {visual.glyphs.length > 0 && (
            <div className="flex flex-wrap justify-center gap-2 rounded-xl border border-line bg-void/60 px-4 py-6 text-nominal">
              {visual.glyphs.map((glyph, i) => (
                <GlyphSymbol key={i} glyph={glyph} size={44} />
              ))}
            </div>
          )}
          {visual.key.length > 0 && (
            <div>
              <p className="mb-2 font-display text-[11px] tracking-[0.14em] text-ink-muted uppercase">
                Key
              </p>
              <dl className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {visual.key.map(({ glyph, letter }) => (
                  <div
                    key={glyph}
                    className="flex items-center justify-center gap-2 rounded-lg border border-line py-1.5"
                  >
                    <dt className="text-nominal">
                      <GlyphSymbol glyph={glyph} size={24} />
                    </dt>
                    <dd className="font-display text-sm font-bold">= {letter}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
        </div>
      )

    case 'morse':
      return (
        <MorseBeacon code={visual.code} showText={visual.showText} chart={visual.chart !== false} />
      )

    case 'morse-chart':
      return <MorseChart />

    case 'gauges':
      return (
        // Two dials per row on phones (big enough to read), the odd one centred; one row on wider screens.
        <div className="flex flex-wrap justify-center gap-x-3 gap-y-5 rounded-xl border border-line bg-void/60 px-3 py-5">
          {visual.gauges.map((gauge, i) => (
            <div key={i} className="w-[46%] sm:w-[22%]">
              <GaugeDial
                index={(visual.firstDial ?? 0) + i}
                value={gauge.value}
                reversed={gauge.reversed}
                labelEvery={visual.labelEvery}
              />
            </div>
          ))}
        </div>
      )
  }
}
