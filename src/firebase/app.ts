import { initializeApp, type FirebaseApp } from 'firebase/app'
import {
  browserSessionPersistence,
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
  signInAnonymously,
  type Auth,
} from 'firebase/auth'
import { connectFirestoreEmulator, initializeFirestore, type Firestore } from 'firebase/firestore'

// Must start with "demo-": the emulators then run fully offline, with no login or real project.
export const EMULATOR_PROJECT_ID = 'demo-tp-escape'

// Must match the ports in firebase.json. Firestore isn't on its usual 8080, which is often taken.
const AUTH_EMULATOR_PORT = 9099
const FIRESTORE_EMULATOR_PORT = 8180

const env = import.meta.env
const useEmulators = env.VITE_USE_EMULATORS === 'true'

function firebaseConfig() {
  if (useEmulators) return { projectId: EMULATOR_PROJECT_ID, apiKey: 'demo-key' }

  const config = {
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  }
  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key)
  if (missing.length > 0) {
    throw new Error(
      `Firebase isn't configured (missing ${missing.join(', ')}). Copy .env.example to .env.local and fill it in, or set VITE_USE_EMULATORS=true.`,
    )
  }
  return config
}

type Services = { app: FirebaseApp; auth: Auth; db: Firestore }
let services: Services | null = null

/** Starts Firebase on first use, so solo play never loads or needs it. */
export function firebase(): Services {
  if (services) return services

  const app = initializeApp(firebaseConfig())
  // Real players keep their identity across tabs and restarts, so they can always rejoin.
  // With emulators, each tab gets its own identity: open three tabs and you have a crew of three.
  const auth = initializeAuth(app, {
    persistence: useEmulators ? browserSessionPersistence : indexedDBLocalPersistence,
  })
  // Optional fields (e.g. a riddle with no alternative answers) can be undefined; Firestore
  // rejects undefined values unless told to skip them.
  const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
  if (useEmulators) {
    const host = window.location.hostname
    connectAuthEmulator(auth, `http://${host}:${AUTH_EMULATOR_PORT}`, { disableWarnings: true })
    connectFirestoreEmulator(db, host, FIRESTORE_EMULATOR_PORT)
  }

  services = { app, auth, db }
  return services
}

export function isUsingEmulators(): boolean {
  return useEmulators
}

/** Signs this browser in anonymously. The same uid comes back after reloads, so rejoining works. */
export async function signIn(): Promise<string> {
  const { auth } = firebase()
  await auth.authStateReady()
  if (auth.currentUser) return auth.currentUser.uid
  const { user } = await signInAnonymously(auth)
  return user.uid
}
