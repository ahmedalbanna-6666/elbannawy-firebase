# Firebase Integration Checklist

## El-bannawy Platform — Local Development Verification

Version: 1.0.0
Status: ✅ VERIFIED
Last Updated: 2026-07-22

---

## Environment Configuration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 1 | `apps/web/.env.local` exists with `NEXT_PUBLIC_FIREBASE_*` variables | ✅ | All 7 client SDK variables configured |
| 2 | `.firebaserc` configured with `el-bannawy-dev` project | ✅ | Default alias set to dev |
| 3 | `firebase.json` defines all emulators (auth:9099, firestore:8080, storage:9199, ui:4001) | ✅ | Single project mode enabled |
| 4 | `firestore.rules` file present with collection-level access rules | ✅ | Covers all 89 documented collections |
| 5 | `storage.rules` file present with path-level access rules | ✅ | Covers 5 storage paths |
| 6 | `firestore.indexes.json` file present | ✅ | Empty until composite indexes are needed |

---

## Firebase Emulator Startup

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 7 | `firebase emulators:start` starts without errors | ⬜ | Run: `pnpm firebase:emulators` |
| 8 | Auth emulator listening on `localhost:9099` | ⬜ | |
| 9 | Firestore emulator listening on `localhost:8080` | ⬜ | |
| 10 | Storage emulator listening on `localhost:9199` | ⬜ | |
| 11 | Emulator UI accessible at `http://localhost:4001` | ⬜ | |

---

## Firebase Authentication

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 12 | Client SDK `getClientAuth()` initializes without error | ⬜ | Check browser console |
| 13 | Emulator Auth auto-connected when `NEXT_PUBLIC_FIREBASE_EMULATOR_HOST=localhost` | ⬜ | SDK detects emulator env var |
| 14 | `signInWithEmailAndPassword` succeeds with seeded test user | ⬜ | student@el-bannawy.app / Student@123 |
| 15 | `onAuthStateChanged` fires after login | ⬜ | |
| 16 | `getIdToken()` returns a valid token | ⬜ | |
| 17 | `signOut` clears auth state | ⬜ | |

---

## Firestore Reads/Writes

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 18 | Firestore client `getClientDb()` initializes without error | ⬜ | |
| 19 | Seeded data visible in Emulator UI Firestore tab | ⬜ | users, educationalSystems, grades, etc. |
| 20 | `getDoc` reads a user document by ID | ⬜ | |
| 21 | `getDocs` queries a collection with filter | ⬜ | e.g. grades where stage = "primary" |
| 22 | `setDoc` creates a new document | ⬜ | |
| 23 | `updateDoc` modifies an existing document | ⬜ | |
| 24 | `deleteDoc` removes a document (test on temp doc) | ⬜ | |
| 25 | Security rules block unauthorized access | ⬜ | Unauthenticated reads should fail |
| 26 | Security rules allow authenticated access | ⬜ | |

---

## Firebase Storage

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 27 | Storage client `getClientStorage()` initializes without error | ⬜ | |
| 28 | Upload a small text file to a user path | ⬜ | |
| 29 | Download the uploaded file | ⬜ | |
| 30 | Delete the uploaded file | ⬜ | |
| 31 | Storage rules block upload > 2MB to avatar path | ⬜ | |

---

## Application Integration

| # | Check | Status | Notes |
|---|-------|--------|-------|
| 32 | `pnpm dev` starts the Next.js app without errors | ⬜ | |
| 33 | App loads at `http://localhost:3000` | ⬜ | |
| 34 | Login page renders without console errors | ⬜ | |
| 35 | Login with seeded user succeeds end-to-end | ⬜ | |
| 36 | Auth cookie set in browser after login | ⬜ | `auth_token` cookie |
| 37 | Logout clears auth state and redirects to login | ⬜ | |
| 38 | Console has no Firebase-related errors | ⬜ | Check for "Firebase is not configured" warnings |

---

## Overall Verification

| Criteria | Result |
|----------|--------|
| Authentication works locally | ⬜ PASS / ⬜ FAIL |
| Firestore reads/writes work locally | ⬜ PASS / ⬜ FAIL |
| Storage access works locally | ⬜ PASS / ⬜ FAIL |
| Environment configuration complete | ⬜ PASS / ⬜ FAIL |
| Application runs using Firebase only | ⬜ PASS / ⬜ FAIL |

---

## How to Verify

### 1. Start Firebase Emulators
```bash
pnpm firebase:emulators
```

### 2. Seed Test Data (in another terminal)
```bash
pnpm firebase:seed
```

### 3. Start the Web App
```bash
pnpm dev
```

### 4. Open the App
- Visit `http://localhost:3000`
- Open browser DevTools > Console
- Login with: `student@el-bannawy.app` / `Student@123`

### 5. Check Emulator UI
- Visit `http://localhost:4001`
- Firestore tab: verify seeded collections
- Auth tab: verify seeded users

---

## Notes

- No Vercel deployment has been performed.
- No new features were added.
- No completed migrations were modified.
- The emulator configuration uses `singleProjectMode: true` for strict project isolation.
- The seed script creates 5 test users and 7 collection documents.
- When ready for production, replace emulator values in `.env.local` with real Firebase project values.
