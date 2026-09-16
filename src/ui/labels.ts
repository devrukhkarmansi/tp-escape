import type { AlertLevel } from '../engine/game.ts'
import type { EvidenceKind } from '../engine/mystery.ts'
import type { StoryBeat } from '../engine/story.ts'

export const BEAT_LABELS: Record<StoryBeat, string> = {
  opening: 'Incoming transmission',
  newInfo: 'Recovered crew log',
  twist: 'Decrypted · priority',
  emergency: 'Emergency broadcast',
}

const PUZZLE_KIND_LABELS: Record<string, string> = {
  caesar: 'Coded message',
  sequence: 'Number pattern',
  anagram: 'Scrambled word',
  riddle: 'Riddle',
  glyph: 'Alien glyphs',
  morse: 'Beacon signal',
  gauge: 'Gauge readings',
  wiring: 'Wiring panel',
  finale: 'Launch sequence',
}

export function puzzleKindLabel(kind: string): string {
  return PUZZLE_KIND_LABELS[kind] ?? 'Puzzle'
}

export const EVIDENCE_LABELS: Record<EvidenceKind, { label: string; className: string }> = {
  alibi: { label: 'Alibi', className: 'bg-nominal/15 text-nominal' },
  item: { label: 'Inventory', className: 'bg-sky-400/15 text-sky-300' },
  place: { label: 'Location', className: 'bg-violet-400/15 text-violet-300' },
  log: { label: 'Station log', className: 'bg-ink-muted/15 text-ink-muted' },
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
