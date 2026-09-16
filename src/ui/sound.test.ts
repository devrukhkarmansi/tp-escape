import { beforeEach, describe, expect, it } from 'vitest'
import { morseSteps } from './morse-timing.ts'
import {
  playAlert,
  playLaunch,
  playMorse,
  playSolved,
  playTick,
  playTimeUp,
  playTransmission,
  playWrong,
  unlockAudio,
} from './sound.ts'

/** A stand-in for the Web Audio API that just records the tones it was asked to play. */
type Played = { frequency: number; startedAt: number; stoppedAt: number }
let played: Played[] = []

class FakeAudioContext {
  state = 'running'
  currentTime = 0
  destination = {}
  createGain() {
    const ramp = () => undefined
    return {
      gain: {
        setValueAtTime: ramp,
        linearRampToValueAtTime: ramp,
        exponentialRampToValueAtTime: ramp,
      },
      connect: (target: unknown) => target,
    }
  }
  createOscillator() {
    const note: Played = { frequency: 0, startedAt: 0, stoppedAt: 0 }
    return {
      type: 'sine',
      frequency: {
        setValueAtTime: (value: number) => {
          note.frequency = value
        },
      },
      connect: (target: unknown) => target,
      start: (at: number) => {
        note.startedAt = at
        played.push(note)
      },
      stop: (at: number) => {
        note.stoppedAt = at
      },
    }
  }
}

beforeEach(() => {
  played = []
  ;(globalThis as { AudioContext?: unknown }).AudioContext = FakeAudioContext
  unlockAudio()
})

describe('sounds', () => {
  it('stays silent until the first tap unlocks audio', () => {
    // Nothing plays before unlockAudio: a fresh module has no audio context at all.
    expect(() => playSolved()).not.toThrow()
  })

  it('plays a rising pair when a system is restored', () => {
    playSolved()
    const frequencies = played.map((note) => note.frequency)
    expect(frequencies).toHaveLength(2)
    expect(frequencies[1]).toBeGreaterThan(frequencies[0]!)
  })

  it('plays one short low buzz for a refused answer', () => {
    playWrong()
    expect(played).toHaveLength(1)
    expect(played[0]!.frequency).toBeLessThan(300)
  })

  it('drops in pitch and plays louder as the alert gets worse', () => {
    playAlert(false)
    const caution = played.map((n) => n.frequency)
    played = []
    playAlert(true)
    const critical = played.map((n) => n.frequency)
    expect(caution).toHaveLength(2)
    expect(critical[0]).toBeLessThan(caution[0]!)
  })

  it('climbs four notes when the Escape Pod launches', () => {
    playLaunch()
    const frequencies = played.map((n) => n.frequency)
    expect(frequencies).toHaveLength(4)
    expect([...frequencies].sort((a, b) => a - b)).toEqual(frequencies)
  })

  it('falls in pitch when time runs out', () => {
    playTimeUp()
    const frequencies = played.map((n) => n.frequency)
    expect(frequencies).toHaveLength(3)
    expect([...frequencies].sort((a, b) => b - a)).toEqual(frequencies)
  })

  it('rises for an incoming transmission, and ticks higher in the last ten seconds', () => {
    playTransmission()
    expect(played).toHaveLength(3)
    played = []
    playTick(false)
    const calm = played[0]!.frequency
    played = []
    playTick(true)
    expect(played[0]!.frequency).toBeGreaterThan(calm)
  })

  it('beeps a Morse signal on the same timing as the beacon light', () => {
    const steps = morseSteps('.-')
    playMorse(steps)
    // One tone per lit step, each starting when the light comes on.
    const lit = steps.filter((step) => step.on)
    expect(played).toHaveLength(lit.length)
    expect(played[0]!.stoppedAt).toBeGreaterThan(played[0]!.startedAt)
  })
})
