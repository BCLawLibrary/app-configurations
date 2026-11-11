import { getApp, getApps, initializeApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";

// Set only in .env.development, so local work signs in against the emulator.
const EMULATOR = process.env.NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR;
const DEMO_PROJECT = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;

// Firebase sign-in in the browser, started the first time it's needed.
// On App Hosting, initializeApp() fills in the app's settings by itself.
// Locally, it talks to the Auth emulator instead of real Google accounts.
export function firebaseAuth(): Auth {
  const alreadyStarted = getApps().length > 0;
  if (alreadyStarted) return getAuth(getApp());

  if (!EMULATOR) return getAuth(initializeApp());

  const auth = getAuth(
    initializeApp({ apiKey: "demo-key", projectId: DEMO_PROJECT }),
  );
  connectAuthEmulator(auth, EMULATOR, { disableWarnings: true });
  return auth;
}
