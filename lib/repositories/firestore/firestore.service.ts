import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Firestore, Timestamp } from 'firebase-admin/firestore';

let firestoreInstance: Firestore | null = null;

export function getFirestoreInstance(): Firestore {
  if (firestoreInstance) {
    return firestoreInstance;
  }

  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (emulatorHost) {
    const apps = getApps();
    const app = apps.length === 0
      ? initializeApp({ projectId: 'test-project' })
      : apps[0];
    const db = getFirestore(app as Parameters<typeof getFirestore>[0]);
    const parts = emulatorHost.split(':');
    const host = parts[0] ?? 'localhost';
    const port = parseInt(parts[1] ?? '8080', 10);
    db.settings({
      host,
      port,
      ssl: false,
    });
    firestoreInstance = db;
    return db;
  }

  const apps = getApps();
  let app = apps.length > 0 ? apps[0] : null;
  if (!app) {
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    let privateKey = process.env.FIREBASE_PRIVATE_KEY;
    const projectId = process.env.FIREBASE_PROJECT_ID;
    if (clientEmail && privateKey && projectId) {
      privateKey = privateKey.replace(/^["']|["']$/g, "");
      if (!privateKey.includes("\n") && privateKey.includes("\\n")) {
        privateKey = privateKey.replace(/\\n/g, "\n");
      }
      app = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
    } else {
      throw new Error(
        'Firebase Admin SDK not configured. Set FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, and FIREBASE_PROJECT_ID.'
      );
    }
  }
  const db = getFirestore(app as Parameters<typeof getFirestore>[0]);
  firestoreInstance = db;
  return db;
}

export function resetFirestoreInstance(): void {
  firestoreInstance = null;
}

export function formatFirestoreTimestamp(value: Timestamp | Date | string | undefined | null): string {
  if (!value) return new Date().toISOString();
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate().toISOString();
  }
  return String(value);
}

export interface RepositoryErrorShape {
  code: 'NOT_FOUND' | 'ALREADY_EXISTS' | 'INTERNAL' | 'UNAVAILABLE';
  message: string;
  retryable: boolean;
  requestId: string;
}

export function toRepositoryError(error: unknown): RepositoryErrorShape {
  const message = (error as Error)?.message ?? 'Unknown error';
  if (message.includes('NOT_FOUND') || message.includes('no entity') || message.includes('not found')) {
    return { code: 'NOT_FOUND', message, retryable: false, requestId: '' };
  }
  if (message.includes('ALREADY_EXISTS') || message.includes('already exists')) {
    return { code: 'ALREADY_EXISTS', message, retryable: false, requestId: '' };
  }
  if (message.includes('UNAVAILABLE') || message.includes('deadline')) {
    return { code: 'UNAVAILABLE', message, retryable: true, requestId: '' };
  }
  return { code: 'INTERNAL', message, retryable: false, requestId: '' };
}
