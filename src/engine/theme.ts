export type ThemePack = {
  id: string
  name: string
  /** Station systems that puzzles attach to. Needs at least as many as the longest shift. */
  systemNames: readonly string[]
}
