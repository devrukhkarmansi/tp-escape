import type { Puzzle } from './puzzle.ts'

/**
 * Makes "The Keyboard!", "keyboard" and " KEYBOARD " compare equal. Hyphens and slashes become
 * spaces ("space-station" = "space station"); other punctuation is dropped ("1,024" = "1024").
 */
export function normalizeAnswer(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[-_/]/g, ' ')
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(a|an|the) /, '')
}

export function checkAnswer(puzzle: Pick<Puzzle, 'answer' | 'altAnswers'>, input: string): boolean {
  const given = normalizeAnswer(input)
  if (given === '') return false
  return [puzzle.answer, ...(puzzle.altAnswers ?? [])].some(
    (accepted) => normalizeAnswer(accepted) === given,
  )
}
