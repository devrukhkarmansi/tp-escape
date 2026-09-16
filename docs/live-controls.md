# Live shared controls — design

**Status:** proposed, not built · **Last updated:** 2026-09-16
**Related:** [multiplayer.md](multiplayer.md) · [puzzle-system.md](puzzle-system.md)

## The idea

Today a split puzzle means each player _describes_ what they see: "my dials read 1, 1, 6." The crew talks, then one person types an answer. That already works, and it's the heart of the co-op.

Live shared controls are the next step: **one player's hands move something on another player's screen, as it happens.**

> **Antenna alignment.** Priya turns a heading dial. On Ravi's screen a signal meter climbs and falls as she turns. Neither can see the other's half. Ravi calls "warmer… warmer… stop!" and Priya holds it. Lock it in at the peak and the system is restored.

That's a different feeling from "read out your half". It's the moment a two-person job actually _feels_ like two people.

## Why it's a bigger build than the puzzles

Everything so far is one shape: a puzzle has an answer, and a player submits a string. Firestore only ever sees finished actions — "Ben answered BEACON" — a handful of writes per game.

A live control is continuous. Priya turning a dial produces a stream of positions, and Ravi's meter has to follow within a fraction of a second, or the "warmer / colder" conversation falls apart.

|                        | Today                          | Live controls                                           |
| ---------------------- | ------------------------------ | ------------------------------------------------------- |
| What's shared          | Finished answers               | A control's position, continuously                      |
| Writes per puzzle      | 1–3                            | 20–100, throttled                                       |
| If the network hiccups | Someone answers a moment later | The dial visibly stutters, and the puzzle is unplayable |
| Where the truth lives  | The game state in Firestore    | Same, but it changes many times a second                |

Firestore's free tier is generous but counted in document writes. A dial at 10 writes a second, for 30 seconds, across a few puzzles a game, is thousands of writes per crew — a different order from what we use today.

## How it would work

**1. Control state lives beside the game, not inside it.**
A new document per system, `rooms/{code}/controls/{systemId}`, holding only `{ position, by, at }`. Keeping it out of the room document means a dial turning doesn't rewrite the whole game state, and doesn't fight with someone answering a different puzzle at the same time.

**2. The turner writes; everyone else listens.**
Whoever holds the control writes their position, throttled to about 10 a second and only when it actually changes. The other screens subscribe and render. Nobody else writes, so there's no merge to resolve.

**3. Smooth over the gaps on the reading end.**
Ten updates a second is choppy for a needle. The reading screen animates towards the last known position rather than jumping to it, so the meter looks continuous even though the data isn't.

**4. Answering stays exactly as it is.**
The engine never sees the live position. When the crew thinks they're right, someone submits — `"HEADING 217"` — through the same `applyAction` path as every other puzzle. Live control is presentation; the answer is still a string the engine checks. **This is the part that keeps the design honest**: no new rules in the reducer, no new way to win.

**5. Solo play gets both halves.**
Same as split puzzles today: alone, you see the dial and the meter together, and it becomes a one-person tuning puzzle. It has to be designed so that's still fun, not a chore.

## Open questions

- **Cost.** Measure a real crew game against the free tier before committing. If it's too expensive, the fallback is coarser steps (a dial with 20 notches rather than 360 degrees), which cuts writes hugely and might even play better.
- **Does it beat talking?** The current split puzzles already create the conversation. Live control might be more toy than puzzle — worth prototyping one and playtesting before building three.
- **What happens when the turner drops?** Piece dealing already moves a dropped player's pieces; the control would need the same, plus a way to take over a half-turned dial.
- **Phones lock.** A player watching a meter isn't touching their screen, so the phone dims and locks. We may need a wake lock, or a design where both halves stay busy.

## What to build first

One puzzle, not three: **antenna alignment**, because it's the clearest to explain and the easiest to fall back from (if live updates prove unaffordable, the same puzzle works with "read out your number" like the gauges do today).

Sequence:

1. A throttled writer and a smoothing reader, with the write count logged, played by two phones for one shift.
2. Check the write count against the free tier.
3. Only then decide whether this becomes a family of puzzles or stays as one showpiece.

## Decision

**Not scheduled.** It's the most interesting idea on the list and the most expensive. The right moment is after a real playtest with friends: if the "read out your half" puzzles already produce the shouting and laughing, the extra machinery may not be worth it — and if they feel flat, this is the fix.
