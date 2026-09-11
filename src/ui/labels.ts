import type { AlertLevel } from '../engine/game.ts'

const PUZZLE_KIND_LABELS: Record<string, string> = {
  caesar: 'Coded message',
  sequence: 'Number pattern',
  anagram: 'Scrambled word',
  riddle: 'Riddle',
}

export function puzzleKindLabel(kind: string): string {
  return PUZZLE_KIND_LABELS[kind] ?? 'Puzzle'
}

/** Riddles are sentences; everything else is a code to stare at, so it gets big spaced mono. */
export function displayClass(kind: string): string {
  return kind === 'riddle'
    ? 'font-sans text-lg/8 font-medium text-balance'
    : 'font-display text-2xl/relaxed font-bold tracking-[0.2em] break-all sm:text-3xl/relaxed'
}

// Every alert level has a word and a shape as well as a color, so it never relies on color alone.
export const ALERT_STYLES: Record<
  AlertLevel,
  { label: string; icon: string; text: string; border: string; fill: string }
> = {
  nominal: {
    label: 'Nominal',
    icon: '●',
    text: 'text-nominal',
    border: 'border-nominal/40',
    fill: 'bg-nominal',
  },
  caution: {
    label: 'Caution',
    icon: '▲',
    text: 'text-caution',
    border: 'border-caution/50',
    fill: 'bg-caution',
  },
  critical: {
    label: 'Critical',
    icon: '■',
    text: 'text-critical',
    border: 'border-critical/60',
    fill: 'bg-critical',
  },
}
