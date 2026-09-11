# Story Outline — Space Station Theme

**Status:** agreed · **Last updated:** 2026-09-11
**Related:** [game-design.md](game-design.md) · [puzzle-system.md](puzzle-system.md)
**Built:** story beats, twist and endings (stage 4A: `src/engine/story.ts`, text in `src/content/space-station/index.ts`). **Next:** the random-traitor finale (4B).

## Premise

**Kepler-9** is a deep-space relay station that passes messages between the outer colonies and Earth. Three hours ago its five-person crew went silent. The last thing the station sent was a garbled Mayday.

The players are the **relief crew**. The moment they dock, the station's caretaker system, **HALCYON**, seals the module and starts a countdown: _"Contamination protocol engaged. Module purge in 10:00."_ The only way off is the escape pod, and it won't launch until the station's failing systems are restored.

The crew didn't just vanish. Someone on board caused this, and the evidence the players recover while fixing systems will show who.

## Tone

- **Tense but playful.** Think "clever heist gone wrong", not horror. No gore, nothing that would make a work icebreaker awkward.
- **Short lines.** Everything is read on a phone mid-puzzle: one or two sentences per message.
- **HALCYON is calm and literal**, never evil. It's following orders. Whose orders is part of the mystery.

## The missing crew

Each run, **3 of these 5** become the suspects, and one of those 3 is the culprit.

| Name              | Role              | Why they could have done it               |
| ----------------- | ----------------- | ----------------------------------------- |
| Cmdr. Ines Okafor | Station commander | Had every access code on the station      |
| Dr. Tomas Kessler | Systems engineer  | Built half of HALCYON's protocols         |
| Priya Nair        | Communications    | Sent the Mayday, and could have faked it  |
| Jun Park          | Medic             | Only person trained to run the cryo bay   |
| Sasha Volkov      | Cargo and supply  | Knew every crate and hiding spot on board |

## What changes every run

Picked from the seed at the start of a game (layer 1 in [puzzle-system.md](puzzle-system.md)):

| Slot                  | Options                                                                      |
| --------------------- | ---------------------------------------------------------------------------- |
| **Culprit**           | One of the 3 suspects                                                        |
| **What they took**    | The relay's encryption core · a sealed cryo sample · HALCYON's black-box log |
| **Where it's hidden** | Cargo crate 7 · a cryo pod · inside the escape pod itself                    |
| **The twist**         | One of the three below                                                       |

### Twist variants (revealed at half time)

1. **The bait.** The Mayday wasn't a cry for help. The culprit sent it to lure a relief crew aboard to take the blame. _"You were never sent to rescue us. You were sent to finish what we started."_
2. **The forged order.** HALCYON isn't malfunctioning. The purge is a quarantine order, and it was signed with the culprit's credentials.
3. **Not gone, just asleep.** The crew didn't vanish. They're in the cryo bay, put under by the culprit to buy time.

## Story beats

Beats fire at fixed fractions of the shift, so they scale with Quick Run, Full Shift and Deep Space. They line up with the alert levels already in the engine:

| Time left | Alert    | Beat                                                                                                               |
| --------- | -------- | ------------------------------------------------------------------------------------------------------------------ |
| All       | nominal  | **Opening log:** docking, HALCYON seals the module, the countdown starts                                           |
| ¾         | nominal  | **New info:** first recovered crew log hints this was sabotage                                                     |
| ½         | caution  | **The twist** (one of the three variants)                                                                          |
| ¼         | critical | **Emergency:** HALCYON starts venting sections; the lights go red                                                  |
| End       | —        | **Won:** the pod launches and the culprit is named · **Lost:** "Module purged," then the culprit is still revealed |

Each beat gets **3 written variants** in the content bank, so repeat runs read differently.

> This replaces the rough "20:00 / 10:00 / 5:00" times in [game-design.md](game-design.md) with fractions of the shift.

## Evidence and the finale

- **Every solved system reveals one evidence card.** Evidence is generated to match this run's culprit, item and hiding place.
- Card types:
  - **Alibi:** clears one suspect (_"Nair was on a call to Earth at 03:47, per the comms log"_)
  - **Access:** points at the culprit (_"Badge scan: KESSLER, cargo hold, 03:52"_)
  - **Item:** narrows down what was taken
  - **Location:** narrows down where it's hidden
- **Guaranteed solvable:** by the last system, the evidence always rules out every other suspect. The generator checks this, and a test proves it across 1,000 seeds, the same way puzzle answers are checked.
- **In multiplayer**, evidence is spread across players' private intel, so the crew has to pool it.
- **Finale screen (Escape Pod):** name the culprit from the three suspects, then enter the launch code built from earlier answers.
- **Every ending reveals the truth.** Won or lost, the debrief names the culprit, what they took and where it was hidden. A crew that runs out of time still gets the payoff, and their evidence cards show how close they were. _(Decided 2026-09-11.)_

## Station systems

Puzzles attach to these. Deep Space needs 12, so there are 14 to keep runs varied. **Escape Pod** is kept for the finale.

Life Support · Airlock Seal · Reactor Core · Nav Array · Comms Relay · Hydroponics Bay · Cryo Bay · Med Bay · Cargo Hold · Gravity Ring · Thermal Shield · Water Reclaimer · Docking Clamp · Power Grid

## Sample lines (to set the voice)

- **Opening:** _"Docking complete. Welcome aboard Kepler-9, relief crew. Contamination protocol engaged. Please remain calm. Module purge in 10:00."_
- **Solving a system:** _"Life Support restored. Oxygen nominal. Thank you for your cooperation."_
- **New info:** _"Recovered log, Cmdr. Okafor, 00:14: 'Someone's been in the cargo hold after lights-out. I'm changing the codes.'"_
- **Emergency:** _"Warning. Venting sections C through F. Please hurry. I would prefer not to purge you."_
- **Lost:** _"Module purged. Kepler-9 will send a Mayday on your behalf. Final record: the purge order was signed by Dr. Tomas Kessler."_

## Decisions

- **The station system is HALCYON** (means "calm, peaceful"). Its calm name clashes with the countdown to a purge, which is the "tense but playful" tone we want. Also considered: ECHO, ARGUS, WARDEN, BEACON, SOL. _(Decided 2026-09-11.)_

## Open questions

- Any names or roles you'd like to change in the missing crew, for example to include in-jokes for your team?
