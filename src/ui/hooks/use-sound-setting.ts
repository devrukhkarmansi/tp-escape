import { useState } from 'react'
import { browserStorage } from '../../store/saved-game.ts'

const KEY = 'tp-escape:sound'

/** Sound on or off, remembered between games. On by default. */
export function useSoundSetting(): [on: boolean, setOn: (on: boolean) => void] {
  const [on, setOnState] = useState(() => {
    try {
      return browserStorage()?.getItem(KEY) !== 'off'
    } catch {
      return true
    }
  })

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
