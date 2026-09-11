// Prints a whole generated game, answers included, to check puzzles by eye.
// Usage: npm run sample -- [seed] [quick|full|deep]
import { spaceStation } from '../src/content/space-station/index.ts'
import { DIFFICULTIES } from '../src/engine/difficulty.ts'
import { createGame } from '../src/engine/game.ts'
import { PUZZLE_GENERATORS } from '../src/engine/puzzles/index.ts'

const [seedArg, difficultyArg = 'full'] = process.argv.slice(2)
const seed = seedArg === undefined ? Math.floor(Math.random() * 2 ** 32) : Number(seedArg)
const difficulty = DIFFICULTIES.find((d) => d.id === difficultyArg)

if (!difficulty || !Number.isInteger(seed)) {
  console.error('Usage: npm run sample -- [seed] [quick|full|deep]')
  process.exit(1)
}

const game = createGame({
  seed,
  difficulty,
  theme: spaceStation,
  generators: PUZZLE_GENERATORS,
  startedAt: 0,
})

console.log(
  `\n${difficulty.name} · seed ${seed} · ${difficulty.systems} systems · ${difficulty.minutes} min\n`,
)
for (const [index, system] of game.systems.entries()) {
  const { puzzle } = system
  const openNote = system.status === 'open' ? ', open at start' : ''
  console.log(`${index + 1}. ${system.name}  [${puzzle.kind}${openNote}]`)
  console.log(`   ${puzzle.prompt}`)
  console.log(`   >> ${puzzle.display}`)
  puzzle.hints.forEach((hint, n) => console.log(`   hint ${n + 1}: ${hint}`))
  console.log(`   answer: ${puzzle.answer}\n`)
}
console.log(`Same game again: npm run sample -- ${seed} ${difficulty.id}\n`)
