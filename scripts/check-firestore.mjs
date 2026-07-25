import { cert, initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Read env vars - same pattern as web app
const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

if (!projectId || !clientEmail || !privateKey) {
  // Try .env.local
  const { readFileSync } = await import('fs');
  const { parse } = await import('dotenv');
  const envLocal = parse(readFileSync('apps/web/.env.local', 'utf-8'));
  process.env.FIREBASE_PROJECT_ID = envLocal.FIREBASE_PROJECT_ID;
  process.env.FIREBASE_CLIENT_EMAIL = envLocal.FIREBASE_CLIENT_EMAIL;
  process.env.FIREBASE_PRIVATE_KEY = envLocal.FIREBASE_PRIVATE_KEY;
}

const rawKey = process.env.FIREBASE_PRIVATE_KEY.replace(/^["']|["']$/g, '');
const key = rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey;

const app = getApps().length === 0
  ? initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: key,
      }),
    })
  : getApps()[0];

const db = getFirestore(app);

console.log('=== FIRESTORE INSPECTION ===\n');

// 1. Check systemSettings
console.log('--- systemSettings ---');
try {
  const ss = await db.collection('systemSettings').doc('system-settings').get();
  if (ss.exists) {
    console.log('EXISTS:', JSON.stringify(ss.data(), null, 2));
  } else {
    console.log('DOCUMENT NOT FOUND');
  }
} catch (e) {
  console.log('ERROR:', e.message);
}

// 2. Check academicYears
console.log('\n--- academicYears ---');
try {
  const years = await db.collection('academicYears').where('deletedAt', '==', null).get();
  console.log(`Found ${years.size} documents`);
  years.forEach(d => {
    const d2 = d.data();
    console.log(`  ID: ${d.id}, name: ${d2.name}, nameAr: ${d2.nameAr}, isActive: ${d2.isActive}, isCurrent: ${d2.isCurrent}, deletedAt: ${d2.deletedAt}, createdAt: ${d2.createdAt}`);
  });
} catch (e) {
  console.log('QUERY FAILED:', e.message);
  // Fallback
  console.log('Fallback: fetching all...');
  try {
    const allDocs = await db.collection('academicYears').get();
    console.log(`Fallback found ${allDocs.size} documents total`);
    allDocs.forEach(d => {
      const d2 = d.data();
      console.log(`  ID: ${d.id}, name: ${d2.name}, deletedAt: ${d2.deletedAt}`);
    });
  } catch (e2) {
    console.log('Fallback also FAILED:', e2.message);
  }
}

// 3. Check academicTerms
console.log('\n--- academicTerms ---');
try {
  const terms = await db.collection('academicTerms').where('deletedAt', '==', null).get();
  console.log(`Found ${terms.size} documents`);
  terms.forEach(d => {
    const d2 = d.data();
    console.log(`  ID: ${d.id}, name: ${d2.name}, nameAr: ${d2.nameAr}, academicYearId: ${d2.academicYearId}, order: ${d2.order}, deletedAt: ${d2.deletedAt}`);
  });
} catch (e) {
  console.log('QUERY FAILED:', e.message);
  console.log('Fallback: fetching all...');
  try {
    const allTerms = await db.collection('academicTerms').get();
    console.log(`Fallback found ${allTerms.size} documents total`);
    allTerms.forEach(d => {
      const d2 = d.data();
      console.log(`  ID: ${d.id}, name: ${d2.name}, academicYearId: ${d2.academicYearId}`);
    });
  } catch (e2) {
    console.log('Fallback also FAILED:', e2.message);
  }
}

// 4. Check existing indexes on academicYears (try orderBy created_at)
console.log('\n--- academicYears orderBy createdAt ---');
try {
  const years2 = await db.collection('academicYears')
    .where('deletedAt', '==', null)
    .orderBy('createdAt', 'desc')
    .get();
  console.log(`SUCCESS: Found ${years2.size} documents`);
} catch (e) {
  console.log('FAILED:', e.message);
}

// 5. Check users collection (admin user existence)
console.log('\n--- users (sample) ---');
try {
  const users = await db.collection('users').limit(3).get();
  console.log(`Found ${users.size} users (limited to 3)`);
  users.forEach(d => {
    const d2 = d.data();
    console.log(`  ID: ${d.id}, role: ${JSON.stringify(d2.role)}, fullName: ${d2.fullName}`);
  });
} catch (e) {
  console.log('ERROR:', e.message);
}

// 6. List all top-level collections
console.log('\n--- All Collections ---');
try {
  const collections = await db.listCollections();
  console.log(`Found ${collections.length} collections:`);
  for (const col of collections) {
    const count = (await db.collection(col.id).limit(1).get()).size;
    console.log(`  ${col.id} (${count > 0 ? 'has data' : 'empty'})`);
  }
} catch (e) {
  console.log('ERROR:', e.message);
}

console.log('\n=== DONE ===');
process.exit(0);
