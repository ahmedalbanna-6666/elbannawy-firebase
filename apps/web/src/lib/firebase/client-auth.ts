import { type FirebaseApp, type FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";

import firebaseConfig, { isFirebaseConfigured } from "./config";

let clientApp: FirebaseApp | null = null;
let clientAuthInstance: Auth | null = null;

function ensureClientApp(): FirebaseApp {
  if (clientApp) return clientApp;
  const existing = getApps().length > 0 ? getApp() : null;
  if (existing) {
    clientApp = existing;
    return existing;
  }
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase client is not configured. Set NEXT_PUBLIC_FIREBASE_* environment variables."
    );
  }
  clientApp = initializeApp(firebaseConfig as FirebaseOptions);

  if (process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST) {
    const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
    connectAuthEmulator(getAuth(clientApp), `http://${host}:9099`);
  }

  return clientApp;
}

export function getClientAuth(): Auth {
  clientAuthInstance ??= getAuth(ensureClientApp());
  return clientAuthInstance;
}

export { ensureClientApp, isFirebaseConfigured };
