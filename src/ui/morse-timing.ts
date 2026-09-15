/**
 * Morse timing: a dot is one unit on, a dash three. One unit off between symbols, three between
 * letters, and a long pause before the beacon repeats. At 250 ms a unit, the light flashes at most
 * twice a second, safely below the 3-flashes-a-second seizure threshold.
 */
export const MORSE_UNIT_MS = 250
const REPEAT_PAUSE_UNITS = 7

export type MorseStep = { on: boolean; ms: number }

export function morseSteps(code: string, unitMs = MORSE_UNIT_MS): MorseStep[] {
  const steps: MorseStep[] = []
  for (const symbol of code) {
    if (symbol === ' ') {
      // A space turns the 1-unit gap after the last symbol into a 3-unit letter gap.
      steps.push({ on: false, ms: 2 * unitMs })
      continue
    }
    steps.push({ on: true, ms: (symbol === '-' ? 3 : 1) * unitMs })
    steps.push({ on: false, ms: unitMs })
  }
  steps.push({ on: false, ms: REPEAT_PAUSE_UNITS * unitMs })
  return steps
}
