const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  appCheckKey: process.env.NEXT_PUBLIC_FIREBASE_APP_CHECK_KEY,
};

export const FIREBASE_ADMIN_CONFIG = {
  projectId: process.env.FIREBASE_PROJECT_ID ?? "",
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL ?? "",
  privateKey: process.env.FIREBASE_PRIVATE_KEY ?? "",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET ?? "",
};

export const isFirebaseConfigured = (): boolean => {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.projectId);
};

export const isFirebaseAdminConfigured = (): boolean => {
  return Boolean(
    FIREBASE_ADMIN_CONFIG.projectId &&
      FIREBASE_ADMIN_CONFIG.clientEmail &&
      FIREBASE_ADMIN_CONFIG.privateKey
  );
};

export default firebaseConfig;
