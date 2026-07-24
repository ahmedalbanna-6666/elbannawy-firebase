import { type FirebaseApp, type FirebaseOptions, getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, connectAuthEmulator, type Auth } from "firebase/auth";
import { getDatabase, connectDatabaseEmulator, type Database } from "firebase/database";
import { getFirestore, connectFirestoreEmulator, type Firestore } from "firebase/firestore";
import { getStorage, connectStorageEmulator, type FirebaseStorage } from "firebase/storage";

import firebaseConfig, { isFirebaseConfigured } from "./config";

let clientApp: FirebaseApp | null = null;
let clientAuthInstance: Auth | null = null;
let clientDbInstance: Firestore | null = null;
let clientStorageInstance: FirebaseStorage | null = null;
let clientRealtimeDbInstance: Database | null = null;

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
    connectDatabaseEmulator(getDatabase(clientApp), host, 9000);
    connectFirestoreEmulator(getFirestore(clientApp), host, 8080);
    connectStorageEmulator(getStorage(clientApp), host, 9199);
  }

  return clientApp;
}

export function getClientAuth(): Auth {
  if (!clientAuthInstance) {
    clientAuthInstance = getAuth(ensureClientApp());
  }
  return clientAuthInstance;
}

export function getClientDb(): Firestore {
  if (!clientDbInstance) {
    clientDbInstance = getFirestore(ensureClientApp());
  }
  return clientDbInstance;
}

export function getClientStorage(): FirebaseStorage {
  if (!clientStorageInstance) {
    clientStorageInstance = getStorage(ensureClientApp());
  }
  return clientStorageInstance;
}

export function getClientRealtimeDatabase(): Database | null {
  const dbUrl = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
  if (!dbUrl) {
    console.warn("Firebase Realtime Database URL not configured");
    return null;
  }
  if (!clientRealtimeDbInstance) {
    clientRealtimeDbInstance = getDatabase(ensureClientApp());
  }
  return clientRealtimeDbInstance;
}

export { isFirebaseConfigured };

export { clientApp, clientAuthInstance as clientAuth, clientDbInstance as clientDb, clientStorageInstance as clientStorage };
