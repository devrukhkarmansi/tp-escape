# Mayday Protocol

A real-time co-op escape room for 1–6 players, played from a shared link on any phone or laptop. Host a crew, split the intel, and get off the station before the module purges.

**Live:** https://tp-escape-deploy.vercel.app

- Design: [docs/game-design.md](docs/game-design.md)
- Puzzles: [docs/puzzle-system.md](docs/puzzle-system.md)
- How we build it: [docs/engineering.md](docs/engineering.md)
- Accounts and tools: [docs/setup.md](docs/setup.md)

## Run it locally

Needs Node 22.12 or newer (see `.nvmrc`).

```bash
npm install
```

```bash
npm run dev
```

Then open the URL it prints (usually http://localhost:5173) and keep the terminal open; `Ctrl+C` stops it. To try it on your phone, run `npm run dev -- --host` and open the "Network" URL from a phone on the same Wi-Fi.

To see the puzzles a game would generate, answers included, without playing:

```bash
npm run sample
```

Add a seed and shift length to get a specific game again, e.g. `npm run sample -- 42 deep`.

## Scripts

| Command                | What it does                                                          |
| ---------------------- | --------------------------------------------------------------------- |
| `npm run dev`          | Local dev server with hot reload                                      |
| `npm run build`        | Typecheck and build for production into `dist/`                       |
| `npm test`             | Run the tests once (`npm run test:watch` to re-run on save)           |
| `npm run sample`       | Print a generated game with answers (`-- [seed] [quick\|full\|deep]`) |
| `npm run lint`         | oxlint, including the engine → store → ui import-order rule           |
| `npm run format`       | Format everything with Prettier                                       |
| `npm run check`        | Everything CI runs except the build: types, lint, format, tests       |
| `npm run test:rules`   | Security-rule tests against the local Firestore emulator (needs Java) |
| `npm run emulators`    | Run the Firebase Auth and Firestore emulators locally                 |
| `npm run deploy:rules` | Publish `firestore.rules` to the real Firebase project                |

## Firebase (multiplayer)

Solo play needs nothing. Multiplayer needs Firebase, either the real project or local emulators:

- **Real project:** copy `.env.example` to `.env.local` and fill in the Firebase web config.
- **Local emulators** (no account, no real data): run `npm run emulators` in one terminal, then `VITE_USE_EMULATORS=true npm run dev` in another. The emulators use the offline project `demo-tp-escape`: Auth on port 9099, Firestore on 8180.

## Branches

- `main`: what's live. Only updated by a release PR from `develop`.
- `develop`: where finished work collects. Feature PRs merge here.
- `feature/…`, `fix/…`, `chore/…`, `docs/…`: one branch per task, opened as a PR into `develop`.

Details in [docs/engineering.md](docs/engineering.md#git-workflow).
