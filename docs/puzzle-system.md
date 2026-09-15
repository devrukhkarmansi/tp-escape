# Puzzle System

**Status:** agreed for v1 · **Last updated:** 2026-09-11
**Related:** [game-design.md](game-design.md)

## Goals

1. **Fresh every run.** A crew replaying the same theme shouldn't see the same puzzles or the same answer to the mystery.
2. **Always solvable.** Every answer is known and checkable. No ambiguous riddles with three valid answers.
3. **Fits the theme.** Puzzles read as part of the story, not a random quiz.
4. **Works for 1–6 players.** Split-information puzzles fall back cleanly for solo play.
5. **Free to run.** No per-game cost by default.

## Split puzzles

Decided 2026-09-15 (stage 4D).

| Question             | Decision                                                                                                                                                                                                                                                     | Why                                                                                                                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------- |
| Which puzzles split? | Coded message (message / cipher key, early and mid-game only), alien glyphs (inscription / symbol key), Morse beacon (beacon / chart), gauges (two banks of dials). Coming next: the wiring panel and manual (4D-2) and split evidence for the finale (4D-3) | Only puzzles where each piece is useless alone. Late coded messages have no key to hand over, so they never split                      |
| How many?            | About one system in three in a crew game (Quick 2, Full 3, Deep 4 → `round(systems / 3)`). Solo games never split                                                                                                                                            | A mix of "go do it alone" and "we need to talk"                                                                                        |
| How private?         | On screen only. Each phone runs `dealPieces` with the seed and player list and shows only its own pieces; nothing extra is stored                                                                                                                            | No extra writes, and it works when the host's phone locks. Anyone reading the code could peek, but that's already true of every answer |
| Who gets what?       | Pieces go round the crew in join order, starting at a seat picked by the seed, so different systems start with different players                                                                                                                             | Every phone computes the same deal without talking to each other                                                                       |
| Someone drops?       | Their pieces move to the connected player holding the fewest pieces of that puzzle, and go back when they reconnect. Your own phone always counts you as online                                                                                              | Nobody gets stuck, and the players still here keep what they already have                                                              |
| Alone on screen?     | If you hold every piece (solo, or everyone else dropped), you see the whole puzzle                                                                                                                                                                           | The "merge splits" path from game-design.md                                                                                            |

How it's built: generators return an optional `split: { prompt, pieces }` alongside the whole puzzle. `createGame({ splitPuzzles: true })` picks which systems use it with its own salted random stream, so turning splitting on never changes the puzzles themselves. The screen (`ui/pieces.ts`) asks `engine/deal.ts` who holds each piece.

## Where freshness comes from — four layers

| Layer                         | What changes each run                                               | Example                                                                           |
| ----------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| **1. The mystery's solution** | Who the culprit is, what they took, where it's hidden               | Kessler is the traitor this run; Okafor next time. Evidence is generated to match |
| **2. Which puzzles appear**   | Which puzzle types fill each system, in what order and unlock graph | Life Support is a cipher this run, a wiring panel next run                        |
| **3. Puzzle parameters**      | The values inside each puzzle                                       | Cipher shift, the word being encoded, sequence rule, wire colors                  |
| **4. Story variants**         | Which version of each story beat plays                              | 3 versions of the twist transmission, 5 versions of the opening log               |

Layers 1–3 come from code, so they're effectively unlimited. Layer 4 is written content, so it's finite but cheap to grow.

## Where puzzles come from — options

| Source                        | How                                                                                            | Pros                                                   | Cons                                                                                                          | Cost                |
| ----------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------- | ------------------- |
| **A. Procedural generators**  | Code templates with random parameters: `generate(seed, difficulty, theme) → puzzle`            | Unlimited, always correct, offline, no cost            | Can feel mechanical without good themed text                                                                  | Free                |
| **B. Curated content bank**   | Hand-written (or AI-drafted, human-reviewed) riddles, story beats, and intel as JSON per theme | Best quality and story fit                             | Finite; repeats eventually                                                                                    | Free (our time)     |
| **C. Live AI generation**     | A small serverless function on Vercel calls an LLM (e.g. Claude) each session                  | Truly new every time, can write story-specific riddles | Pay per use; slower; answers can be ambiguous; needs validation and moderation; API key must stay server-side | Small, but not free |
| **D. Public datasets / APIs** | Word lists, trivia APIs (e.g. Open Trivia DB)                                                  | Large and free                                         | Trivia isn't escape-room puzzling; mixed quality and licensing; no story fit                                  | Free                |

### Decision: A + B now, C later

- **Generators (A) are the backbone.** Most systems are generated, so variety is effectively unlimited and every answer is checkable.
- **The curated bank (B) supplies what code can't:** riddles, story beats, private intel text, the twist. We use AI to _draft_ this offline, review it, and commit it as JSON, so there's no runtime cost.
- **Word lists (D)** get bundled as data files feeding the generators (themed words for ciphers and anagrams), filtered to be family-friendly.
- **Live AI (C) is a later phase**, added if the game grows beyond friend groups. It would be used for flavor or riddles, with a validation step. The `Generator` shape below already fits an AI-backed source, so it can plug in without rewriting the engine.

### Adding new puzzle types later

Adding a puzzle type means writing one generator file and adding it to the list the engine picks from. Nothing else changes. That's deliberate: new puzzles should be cheap to add at any time.

## Seeded sessions — how every phone sees the same puzzles

The host creates a random **seed** and saves it in the room document. Every phone runs the same generators with that seed and a deterministic random number generator, so every phone gets identical puzzles without storing puzzle content in Firestore.

As built (`src/engine/puzzle.ts`):

```ts
type Puzzle = {
  id: string // e.g. "caesar-3"
  kind: string // which generator made it
  prompt: string // in-world instructions: "Intercepted transmission. Every letter was moved…"
  display?: string // the thing to work on, shown large: "TFOTPS", "7, 11, 15, 19, 23"
  answer: string
  altAnswers?: readonly string[]
  hints: readonly string[] // revealed one at a time, easiest nudge first
}

type PuzzleGenerator = {
  kind: string
  generate(rng: Rng, context: { level: number; theme: ThemePack }): Omit<Puzzle, 'id' | 'kind'>
}
```

`level` goes from 0 (first system) to 1 (last), so puzzles get harder through a game. Split information for multiplayer gets added in stage 4.

Learning angle: seeded PRNGs (e.g. mulberry32), pure functions, and deterministic generation. Replaying a seed also makes bugs reproducible.

## Puzzle catalog

Legend: **Gen** = can be generated by code · **Split** = works as split information across players

| Type                                                         | Example on the station                                        | Gen              | Split                                | v1?                 |
| ------------------------------------------------------------ | ------------------------------------------------------------- | ---------------- | ------------------------------------ | ------------------- |
| Caesar / Atbash cipher                                       | Garbled airlock override; key is in someone's intel           | ✅               | ✅ one has the text, another the key | ✅                  |
| Symbol substitution                                          | Alien-glyph panel with a partial glyph table                  | ✅               | ✅ table split across players        | ✅                  |
| Number sequence                                              | Reactor pressure readings, predict the next                   | ✅               | —                                    | ✅                  |
| Keypad / Morse                                               | Distress beacon blinking or beeping a code                    | ✅               | ✅ one hears it, one has the chart   | ✅                  |
| Anagram / word unscramble                                    | Corrupted file names in the crew log                          | ✅               | —                                    | ✅                  |
| **Manual lookup** (_Keep Talking and Nobody Explodes_-style) | One player sees a wiring panel, another has the repair manual | ✅               | ✅ built for it                      | ✅ signature puzzle |
| Gauge / dial reading                                         | Each player sees one gauge; readings combine into a code      | ✅               | ✅                                   | ✅                  |
| Memory sequence (Simon)                                      | Reboot the nav array by repeating a light pattern             | ✅               | —                                    | later               |
| Maze / pipe routing                                          | Reroute coolant through a grid                                | ✅               | ✅ one sees the map, one steers      | later               |
| Logic deduction                                              | Who was where at 03:47?                                       | ✅ with a solver | ✅ clues split                       | finale              |
| Riddle                                                       | Life Support voice-lock riddle                                | ❌ bank          | —                                    | ✅ small bank       |
| **Meta-puzzle**                                              | Earlier answers combine into the escape pod code              | ✅               | —                                    | ✅ finale           |

## The finale: a mystery that changes every run

**In v1, kept simple:** 3 suspects, one evidence card per solved system, and a final screen that asks for the culprit plus the code. Without it, the central mystery has no payoff and the last screen is just another code. Fancier deduction (full logic grids, red herrings) comes later.

1. At session start the seed picks a **culprit** from 3–4 suspects, plus what they took and where it's hidden.
2. Solving each system reveals an **evidence card**. Evidence is generated to match the culprit and rule out the others.
3. The final screen asks the crew to **name the culprit and enter the escape code** (built from earlier answers).
4. Private intel gives each player different pieces of evidence, so the crew has to pool them.

This is what makes replays worthwhile: the same theme can play out with a different ending.

## Avoiding repeats

- **Within one game (built):** no two systems share an answer. If a puzzle repeats an earlier answer, it's regenerated from a variation of that system's own seed, so no other system changes. Every puzzle type is used once before any repeats.
- **Generated puzzles, across games:** the parameter space is huge, so repeats are rare by chance.
- **Bank content** (riddles, story variants): track seen item ids per player (Firestore under their anonymous uid, falling back to localStorage). When picking, prefer items that the fewest current crew members have seen.

## Answer checking

- Normalize before comparing: lowercase, trim, drop leading "a/an/the", collapse spaces.
- Accept alternates listed in `altAnswers`.
- Generated puzzles have exact answers; riddles in the bank need their alternates written out.

## Difficulty scaling

Each generator takes a difficulty setting: cipher shift range, sequence rule complexity, number of wires or rules in the manual, grid size. Shift length decides **how many** systems there are and how steeply difficulty rises.

## v1 content targets

- Puzzle types: everything marked ✅ in the v1 column of the catalog above
- Riddle bank: ~30 riddles for the space station theme
- Story variants: 3 versions of each story beat (opening log, ¾ reveal, twist, ¼ emergency, ending)

## Built so far

| Stage | What                                                                                                                    | Where                            |
| ----- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------- |
| 2B    | Letter-shift code (`caesar`): shift stated early, one letter pair mid-game, found by the player late (4–12)             | `src/engine/puzzles/caesar.ts`   |
| 2B    | Number pattern (`sequence`): constant steps early; doubling/alternating mid; growing steps, sum-of-two and squares late | `src/engine/puzzles/sequence.ts` |
| 2B    | Unscramble (`anagram`): theme words, 4–6 letters early up to 7–9 late                                                   | `src/engine/puzzles/anagram.ts`  |
| 2B    | Riddle bank (`riddle`): 15 of the ~30 target                                                                            | `src/engine/puzzles/riddle.ts`   |
| 2B    | Space station content: 14 systems, 61 words, 15 riddles, intros per puzzle type                                         | `src/content/space-station/`     |
| 4C    | Alien glyphs (`glyph`): word in symbols with a key plus decoys; one or two symbols missing from the key later           | `src/engine/puzzles/glyph.ts`    |
| 4C    | Morse beacon (`morse`): 4–5 letter word blinked and beeped; written out early, light and sound only later               | `src/engine/puzzles/morse.ts`    |
| 4C    | Gauge readings (`gauge`): 3–4 analog dials; fewer printed numbers later, one dial with its scale backwards              | `src/engine/puzzles/gauge.ts`    |
| 4D    | Split puzzles: `split` pieces on caesar, glyph, morse and gauge; `dealPieces` shares them out among connected players   | `src/engine/deal.ts`             |

Tests check every type against 1,000 seeds, check that each puzzle's instructions are true, and play 1,000 full games per shift length.
