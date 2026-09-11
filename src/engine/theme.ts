export type Riddle = {
  question: string
  answer: string
  altAnswers?: readonly string[]
  hints: readonly string[]
}

/** One message to the crew: who it's from, and a few short lines. */
export type Transmission = {
  /** e.g. "HALCYON" or "Jun Park · Medic". The screen adds the label ("Recovered crew log"). */
  from: string
  /** Short lines, read on a phone mid-puzzle. `{time}` becomes the shift length, e.g. "10:00". */
  lines: readonly string[]
}

/** Several versions of each story moment, so replays read differently. */
export type ThemeStory = {
  opening: readonly Transmission[]
  newInfo: readonly Transmission[]
  twist: readonly Transmission[]
  emergency: readonly Transmission[]
  won: readonly string[]
  lost: readonly string[]
}

export type ThemePack = {
  id: string
  name: string
  /** Station systems that puzzles attach to. Needs at least as many as the longest shift. */
  systemNames: readonly string[]
  /** Single words, capital letters only, used by word puzzles. No two may be anagrams. */
  words: readonly string[]
  riddles: readonly Riddle[]
  /** Short in-world lead-ins per puzzle kind, e.g. "Reactor pressure readings". */
  flavor: Readonly<Record<string, readonly string[]>>
  story: ThemeStory
}
