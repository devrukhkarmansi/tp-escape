import { useState } from 'react'
import { browserStorage } from '../../store/saved-game.ts'

const KEY = 'tp-escape:sound'

/**
 * Is sound on right now? Read at the moment of playing, for parts of a puzzle that make their own
 * noise (the memory pads) and so can't be handed the screen's copy of the setting.
 */
export function soundEnabled(): boolean {
  try {
    return browserStorage()?.getItem(KEY) !== 'off'
  } catch {
    return true
  }
}

/** Sound on or off, remembered between games. On by default. */
export function useSoundSetting(): [on: boolean, setOn: (on: boolean) => void] {
  const [on, setOnState] = useState(soundEnabled)

  function setOn(next: boolean) {
    setOnState(next)
    try {
      browserStorage()?.setItem(KEY, next ? 'on' : 'off')
    } catch {
      // Not remembered, but still applies for this game.
    }
  }

  return [on, setOn]
}
