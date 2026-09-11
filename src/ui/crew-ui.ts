import { browserStorage } from '../store/saved-game.ts'

// Player colors stay away from teal / amber / red, which mean alert levels.
export const PLAYER_COLORS = [
  { dot: 'bg-sky-400', tag: 'bg-sky-400/15 text-sky-300' },
  { dot: 'bg-violet-400', tag: 'bg-violet-400/15 text-violet-300' },
  { dot: 'bg-pink-400', tag: 'bg-pink-400/15 text-pink-300' },
  { dot: 'bg-lime-400', tag: 'bg-lime-400/15 text-lime-300' },
  { dot: 'bg-orange-300', tag: 'bg-orange-300/15 text-orange-200' },
  { dot: 'bg-cyan-200', tag: 'bg-cyan-200/15 text-cyan-100' },
] as const

export function playerColor(index: number) {
  return PLAYER_COLORS[Math.abs(index) % PLAYER_COLORS.length]!
}

const NAME_KEY = 'tp-escape:name'
export const MAX_NAME_LENGTH = 16

/** The name you used last time, so joining another crew is one tap. */
export function rememberedName(): string {
  try {
    return browserStorage()?.getItem(NAME_KEY) ?? ''
  } catch {
    return ''
  }
}

export function rememberName(name: string): void {
  try {
    browserStorage()?.setItem(NAME_KEY, name)
  } catch {
    // Not remembered next time; nothing else depends on it.
  }
}

export function cleanName(input: string): string {
  return input.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH)
}
