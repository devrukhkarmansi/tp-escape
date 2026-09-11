# Engineering Practices

**Status:** agreed · **Last updated:** 2026-09-11
**Related:** [game-design.md](game-design.md) · [puzzle-system.md](puzzle-system.md) · [setup.md](setup.md)

## Environment

| Thing           | Value                                                                          |
| --------------- | ------------------------------------------------------------------------------ |
| Repo            | https://github.com/devrukhkarmansi/tp-escape (**public**)                      |
| Node            | 22 (pinned in `package.json` `engines` and `.nvmrc`)                           |
| Package manager | npm (already installed; one less tool to learn)                                |
| Firebase        | project `tp-escape`, Firestore in `asia-south1`, Anonymous Auth on, Spark plan |
| Hosting         | Vercel Hobby, connected to the repo                                            |
| Java            | 21, needed by the Firebase emulators (stage 3)                                 |

> **The repo is public.** Anyone can read the code and the commit history. Never commit secrets, and don't use an email in commits you don't want public (see "Commit identity").

## Architecture rule: three layers, dependencies point inward

```
ui  ──►  store  ──►  engine
(React)  (where state lives)  (pure game logic)
```

- **engine**: plain TypeScript. Seeded randomness, puzzle generators, answer checking, game rules, scoring. **Imports nothing from React or Firebase.** It's where the game actually lives, and the most heavily tested layer.
- **store**: one `GameStore` interface with two implementations: `LocalStore` (solo, in memory, stage 2) and `FirestoreStore` (multiplayer, stage 3). The UI doesn't know which one it's talking to.
- **ui**: React screens and components. It renders state and sends actions; no game rules live here.

**Why:** stage 2 (solo, no Firebase) and stage 3 (multiplayer) share all of the UI and engine; only the store changes. The engine can be tested without a browser or a database. The linter enforces the import direction (see `.oxlintrc.json`), so the rule can't quietly erode.

## Folder structure

```
tp-escape/
├── docs/
├── public/
├── src/
│   ├── engine/
│   │   ├── rng.ts               seeded random number generator
│   │   ├── puzzles/
│   │   │   ├── index.ts         registry: the list of generators the engine picks from
│   │   │   ├── caesar.ts        one file per puzzle type
│   │   │   └── ...
│   │   ├── check-answer.ts
│   │   ├── game.ts              game state + actions (start, solve, hint, tick)
│   │   └── score.ts
│   ├── content/
│   │   └── space-station/       theme pack: story beats, riddles, word lists, palette
│   ├── store/
│   │   ├── game-store.ts        the interface
│   │   ├── local-store.ts       stage 2
│   │   └── firestore-store.ts   stage 3
│   ├── firebase/                app init + anonymous auth
│   ├── ui/
│   │   ├── screens/             Home, Lobby, Board, System, Alert, Debrief
│   │   └── components/          Timer, SystemCard, IntelPanel, …
│   └── main.tsx
├── tests/e2e/                   Playwright, stage 3+
├── firestore.rules              security rules, versioned like code
└── firebase.json
```

## Libraries

| Need               | Choice                                              | Notes                                                                      |
| ------------------ | --------------------------------------------------- | -------------------------------------------------------------------------- |
| Build / dev server | Vite                                                |                                                                            |
| UI                 | React + TypeScript                                  |                                                                            |
| Styling            | Tailwind CSS v4                                     | Theme tokens (colors, fonts) defined once in CSS, taken from the prototype |
| Animation          | Motion (formerly "Framer Motion", package `motion`) | Added in stage 5, not before                                               |
| Routing            | React Router                                        | Two routes: `/` and `/c/:crewCode`, so the share link carries the code     |
| State              | React state + context. No state library to start    | Add Zustand only if context becomes painful                                |
| Tests              | Vitest, Playwright                                  | See "Testing"                                                              |

Rule of thumb: add a library only when the need shows up in the code, not in advance.

## Code style

- **TypeScript strict mode** (`strict`, `noUncheckedIndexedAccess`). No `any`; use `unknown` and narrow it.
- **oxlint** for linting. It's what the current Vite template ships: an ESLint-compatible linter written in Rust, and much faster. Our import-direction rule lives in `.oxlintrc.json`. **Prettier** for formatting, run on save and in CI.
- **Naming:** React components `PascalCase.tsx`, everything else `kebab-case.ts`.
- **Small, pure functions in the engine.** Same inputs, same output, no hidden state. It's what makes seeds and tests work.
- **Comments explain _why_, not _what_.** If a comment restates the code, delete it.
- **Phones and laptops are both first-class.** Build the phone layout first (375px wide, tap targets at least 44px), then give every screen a laptop layout from 1024px (Tailwind `lg:`) that uses the extra width instead of stretching the phone column. Check both before merging. Respect `prefers-reduced-motion`.

## Testing

| Layer          | Tool                       | What we test                                                                                                               | When                                     |
| -------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| Engine         | Vitest                     | Same seed → same puzzles. **For 1,000 random seeds, every generated puzzle's answer passes its own checker.** Scoring math | Stage 2 onward; the most important tests |
| Security rules | Vitest + Firebase emulator | A player can't read another player's intel. Nobody can edit a room they're not in                                          | Stage 3–4                                |
| UI             | Vitest + Testing Library   | Only components with real logic (e.g. the timer); no snapshot tests                                                        | As needed                                |
| End-to-end     | Playwright                 | **Two browser windows as two phones:** host, join, solve, see it sync                                                      | Stage 3 onward                           |

## Git workflow

```
feature/…  ── PR, squash ──►  develop  ── release PR, merge commit ──►  main  ──►  live site
```

- **`main`**: what's live, and Vercel's production branch. It only changes through a **release PR** from `develop`.
- **`develop`**: where finished work collects. It's GitHub's default branch, so new PRs target it automatically. Vercel gives it its own stable preview URL, which acts as a staging copy of the next release.
- **Work branches**: `feature/…`, `fix/…`, `chore/…`, `docs/…`, created from `develop` and merged back into it through a PR.
- **Every PR, even working solo**, gets:
  - CI checks (GitHub Actions: typecheck, lint, format, test, build)
  - a **Vercel preview URL**, a live copy of that branch you can open on your phone before merging
- **How to merge:**
  - work branch → `develop`: **squash**, so each task becomes one tidy commit
  - `develop` → `main`: **merge commit, never squash.** Squashing here would give `main` different commits from `develop`, and the next release PR would show old changes again or conflict.
- **Hotfix** (something broken on the live site): branch `fix/…` from `main`, PR it into `main`, then merge `main` back into `develop` so the two don't drift apart.
- **Commit messages:** a light form of Conventional Commits: `feat: add caesar generator`, `fix: timer drift on lock screen`, `docs: …`, `chore: …`.
- **The one exception:** the very first commit (docs only) went straight to `main`, because a PR needs an existing branch to merge into.

### Commit identity

The repo is public, so commit emails are public too. This repo uses your **GitHub no-reply address**, set for this repo only (your global git config still uses your work email everywhere else):

```bash
git config user.email "58716593+devrukhkarmansi@users.noreply.github.com"
```

Recommended on GitHub too: **Settings → Emails** → tick **Keep my email addresses private** and **Block command line pushes that expose my email**.

## Config and secrets

- Firebase web config goes in `.env.local` as `VITE_FIREBASE_*` variables (git-ignored locally, copied into Vercel's environment settings).
- **Anything prefixed `VITE_` ships to the browser.** That's fine for the Firebase config, which is public by design. It is **never** fine for a real secret: a future Claude API key would live only in a Vercel serverless function's environment.
- Security rules (`firestore.rules`) live in the repo and are deployed with the Firebase CLI, so access control is reviewed like code.

## Definition of done (every PR)

- [ ] Typecheck, lint, tests, build all pass in CI
- [ ] Checked on a phone-width screen (the Vercel preview on a real phone is best)
- [ ] Docs updated if a decision changed

## Stage 1 — pipeline (the first thing we build)

**Goal:** pushing to GitHub updates a live URL, and every PR gets checks and a preview link. No game logic yet.

1. `git init`, repo-only commit email, `.gitignore`, `.nvmrc`
2. Scaffold Vite + React + TypeScript into this folder (keeping `docs/`)
3. Tailwind v4 with the prototype's colors and fonts as theme tokens
4. Strict TypeScript, oxlint (with the import-direction rule), Prettier
5. Vitest with one real test (the seeded RNG is a good first one)
6. GitHub Actions CI workflow
7. A static Home screen (title, Host / Join buttons that don't do anything yet)
8. README: how to run locally
9. Push → import the repo in Vercel → **first live URL**
10. Open a small follow-up PR to see the preview URL and CI checks work end to end

## How we work together

- **Claude writes the code** and explains each change: what it does, why it's built that way, and what's worth learning from it. Explanations go in chat and in each PR description.
- **You review and merge** the PRs. Ask about anything that isn't clear before merging. The review is where the learning happens.
- Decisions get recorded in `docs/` as they're made.
