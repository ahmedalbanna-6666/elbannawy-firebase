import "server-only";

import { cert, getApp, getApps, initializeApp, type AppOptions, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

import { FIREBASE_ADMIN_CONFIG, isFirebaseAdminConfigured } from "./config";

let adminApp: App | null = null;
let adminAuthInstance: Auth | null = null;
let adminDbInstance: Firestore | null = null;
let adminStorageInstance: Storage | null = null;

function ensureAdminApp(): App {
  if (adminApp) return adminApp;
  const existing = getApps().length > 0 ? getApp() : null;
  if (existing) {
    adminApp = existing;
    return existing;
  }
  if (!isFirebaseAdminConfigured()) {
    throw new Error(
      "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }
  const options: AppOptions = {
    credential: cert({
      projectId: FIREBASE_ADMIN_CONFIG.projectId,
      clientEmail: FIREBASE_ADMIN_CONFIG.clientEmail,
      privateKey: FIREBASE_ADMIN_CONFIG.privateKey.replace(/\\n/g, "\n"),
    }),
    projectId: FIREBASE_ADMIN_CONFIG.projectId,
    storageBucket: FIREBASE_ADMIN_CONFIG.storageBucket || undefined,
  };
  adminApp = initializeApp(options);
  return adminApp;
}

export function getAdminAuth(): Auth {
  if (!adminAuthInstance) {
    adminAuthInstance = getAuth(ensureAdminApp());
  }
  return adminAuthInstance;
}

export function getAdminDb(): Firestore {
  if (!adminDbInstance) {
    adminDbInstance = getFirestore(ensureAdminApp());
  }
  return adminDbInstance;
}

export function getAdminStorage(): Storage {
  if (!adminStorageInstance) {
    adminStorageInstance = getStorage(ensureAdminApp());
  }
  return adminStorageInstance;
}

export { adminAuthInstance as adminAuth, adminDbInstance as adminDb, adminStorageInstance as adminStorage };
