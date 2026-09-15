import type { PuzzleGenerator } from '../puzzle.ts'
import { anagram } from './anagram.ts'
import { caesar } from './caesar.ts'
import { gauge } from './gauge.ts'
import { glyph } from './glyph.ts'
import { morse } from './morse.ts'
import { riddle } from './riddle.ts'
import { sequence } from './sequence.ts'

/** Every puzzle type the engine can pick from. Adding a type = one file + one entry here. */
export const PUZZLE_GENERATORS: readonly PuzzleGenerator[] = [
  caesar,
  sequence,
  anagram,
  riddle,
  glyph,
  morse,
  gauge,
]
