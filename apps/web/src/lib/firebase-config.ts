import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator, type Database } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
};

let app: FirebaseApp | null = null;
let database: Database | null = null;
let authInstance: Auth | null = null;

function getFirebaseApp(): FirebaseApp {
  if (app) return app;
  const existing = getApps().length > 0 ? getApps()[0] : null;
  if (existing) {
    app = existing;
    return existing;
  }
  app = initializeApp(firebaseConfig);
  connectEmulators(app);
  return app;
}

function connectEmulators(app: FirebaseApp): void {
  const host = process.env.NEXT_PUBLIC_FIREBASE_EMULATOR_HOST;
  if (!host) return;
  try { connectAuthEmulator(getAuth(app), `http://${host}:9099`, { disableWarnings: true }); } catch {}
  try { connectDatabaseEmulator(getDatabase(app), host, 9000); } catch {}
}

export function getFirebaseAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(getFirebaseApp());
  }
  return authInstance;
}

export function getRealtimeDatabase(): Database | null {
  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!dbUrl) {
    console.warn("Firebase Realtime Database URL not configured");
    return null;
  }

  database ??= getDatabase(getFirebaseApp());
  return database;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  );
}
