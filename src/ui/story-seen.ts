import { STORY_BEATS, type StoryBeat } from '../engine/story.ts'
import { browserStorage } from '../store/saved-game.ts'

// Which transmissions this device has already shown, so a reload doesn't replay them.
// Per device on purpose: in a crew, everyone dismisses their own.
const key = (gameKey: string) => `tp-escape:seen-beats:${gameKey}`
const KNOWN = new Set<string>(STORY_BEATS.map((b) => b.beat))

export function loadSeenBeats(gameKey: string): StoryBeat[] {
  try {
    const raw = browserStorage()?.getItem(key(gameKey))
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((b): b is StoryBeat => typeof b === 'string' && KNOWN.has(b))
      : []
  } catch {
    return []
  }
}

export function saveSeenBeats(gameKey: string, beats: readonly StoryBeat[]): void {
  try {
    browserStorage()?.setItem(key(gameKey), JSON.stringify(beats))
  } catch {
    // Not remembered: after a reload the latest message just shows once more.
  }
}
