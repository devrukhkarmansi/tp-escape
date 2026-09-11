export type Riddle = {
  question: string
  answer: string
  altAnswers?: readonly string[]
  hints: readonly string[]
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
}
