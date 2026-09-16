import type { PuzzleGenerator } from '../puzzle.ts'
import { anagram } from './anagram.ts'
import { anomaly } from './anomaly.ts'
import { caesar } from './caesar.ts'
import { gauge } from './gauge.ts'
import { glyph } from './glyph.ts'
import { memory } from './memory.ts'
import { morse } from './morse.ts'
import { riddle } from './riddle.ts'
import { routing } from './routing.ts'
import { sequence } from './sequence.ts'
import { wheel } from './wheel.ts'
import { wiring } from './wiring.ts'

/** Every puzzle type the engine can pick from. Adding a type = one file + one entry here. */
export const PUZZLE_GENERATORS: readonly PuzzleGenerator[] = [
  caesar,
  sequence,
  anagram,
  riddle,
  glyph,
  morse,
  gauge,
  wiring,
  routing,
  memory,
  wheel,
  anomaly,
]
