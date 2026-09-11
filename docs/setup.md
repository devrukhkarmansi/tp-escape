# Setup — accounts and tools

**Last updated:** 2026-09-11 · **Related:** [game-design.md](game-design.md)

Do these in order. Nothing here costs money, and no credit card is needed anywhere.

## Already installed on this Mac

| Tool              | Version | Needed for                                                    |
| ----------------- | ------- | ------------------------------------------------------------- |
| Node.js           | 22.12.0 | Running and building the app (Vite needs 20.19+ or 22.12+) ✅ |
| npm               | 11.0.0  | Installing packages ✅                                        |
| git               | 2.54.0  | Version control ✅                                            |
| Homebrew          | 6.0.18  | Installing the GitHub CLI ✅                                  |
| GitHub CLI (`gh`) | 2.100.0 | Logging this Mac into GitHub (installed in step 1) ✅         |
| Java              | 21      | Firebase emulators, from stage 3 ✅                           |

> This repo commits with your GitHub no-reply address instead of your work email. See [engineering.md → Commit identity](engineering.md#commit-identity).

## 1. GitHub: account + empty repo

1. Sign in at **github.com** with your **personal** account (create one if needed).
2. Top right **+** → **New repository**
   - Owner: **your personal account**, not an organization. Vercel's free plan can't deploy private repos owned by an organization.
   - Name: `tp-escape`
   - Public or Private: your choice. Both work.
   - **Leave "Add a README", ".gitignore" and "license" unticked.** We already have files locally, and an empty repo avoids a conflict on the first push.
3. Click **Create repository** and copy its URL.
4. Log this Mac into GitHub from your own terminal:
   ```bash
   brew install gh
   ```
   ```bash
   gh auth login
   ```
   Choose **GitHub.com** → **HTTPS** → **Yes** (use as git credentials) → **Login with a web browser**, then follow the prompts.

## 2. Firebase: project, database, sign-in

1. Go to **console.firebase.google.com** and sign in with a Google account.
2. **Create a project** → name it `tp-escape`.
   - **Google Analytics: turn it off.** We don't need it.

> The Firebase sidebar no longer has a "Build" menu. Products are grouped under **Product categories** (Databases & Storage, Security, …). The paths below use the current layout.

3. **Firestore database**: left sidebar → **Databases & Storage → Firestore** → **Create database** (pick Firestore, not "Realtime Database" or "SQL Connect")
   - If asked for an edition, choose **Standard**.
   - **Location: pick the region closest to you and your players. This can't be changed later.** We chose **`asia-south1` (Mumbai)**, since the host and most players are in India.
   - Rules: choose **production mode** (everything locked). We'll write proper rules in stage 3. Test mode would leave the database open to anyone.
4. **Anonymous sign-in**: **Security → Authentication** → **Get started** → **Sign-in method** tab → **Anonymous** → **Enable** → **Save**
5. **Register the web app**: sidebar **Settings** → **General** → under "Your apps" click the **web icon `</>`**
   - Nickname: `tp-escape-web`
   - **Don't tick "Firebase Hosting".** We're using Vercel.
   - Firebase shows a `firebaseConfig` block (apiKey, projectId…). **Save it in a note.** We'll need it in stage 3. It isn't a secret (every web app ships it to the browser), but you don't need to paste it into chat.
6. **Stay on the free Spark plan.** The bottom of the sidebar shows "Spark, No-cost ($0/month)"; ignore the Upgrade button.

## 3. Vercel: account only (for now)

1. Go to **vercel.com** → **Sign Up** → choose **Hobby** → **Continue with GitHub**.
2. When it asks to install the Vercel GitHub app, choose **Only select repositories** → `tp-escape`. That gives it access to this one repo, not everything you own.
3. **Don't import or deploy anything yet.** The repo is empty, so there's nothing to build. We'll connect it in stage 1 after the first push.

> The Hobby plan is for personal, non-commercial projects. That fits a game for friends; if it ever becomes commercial, it would need the paid plan.

## Checklist — all done 2026-09-11

- [x] `tp-escape` repo created (empty, public): https://github.com/devrukhkarmansi/tp-escape
- [x] `gh auth login` done on this Mac (account `devrukhkarmansi`)
- [x] Firebase project created, Analytics off
- [x] Firestore created (Standard, production mode, `asia-south1`)
- [x] Anonymous sign-in enabled
- [x] Web app registered, `firebaseConfig` saved somewhere
- [x] Vercel account created with GitHub, access limited to `tp-escape`
