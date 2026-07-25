const { cert, initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const { readFileSync } = require('fs');

// Manually parse .env.local
const envText = readFileSync('.env.local', 'utf-8');
for (const line of envText.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const k = trimmed.slice(0, eqIdx).trim();
  let v = trimmed.slice(eqIdx + 1).trim();
  if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
    v = v.slice(1, -1);
  }
  if (!process.env[k]) process.env[k] = v;
}

const rawKey = (process.env.FIREBASE_PRIVATE_KEY || '').replace(/^["']|["']$/g, '');
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

async function main() {
  console.log('=== FIRESTORE INSPECTION ===\n');

  // 1. Check systemSettings
  console.log('--- systemSettings ---');
  try {
    const ss = await db.collection('systemSettings').doc('system-settings').get();
    if (ss.exists) {
      console.log('EXISTS:', JSON.stringify(ss.data(), null, 2));
    } else {
      console.log('DOCUMENT NOT FOUND - this is likely the issue!');
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
      console.log(`  ID: ${d.id}, name: ${d2.name}, nameAr: ${d2.nameAr}, isActive: ${d2.isActive}, isCurrent: ${d2.isCurrent}, createdAt: ${d2.createdAt}`);
    });
  } catch (e) {
    console.log('QUERY FAILED:', e.message);
    console.log('Fallback: fetching all...');
    try {
      const allDocs = await db.collection('academicYears').get();
      console.log(`Fallback found ${allDocs.size} documents total`);
      allDocs.forEach(d => {
        const d2 = d.data();
        console.log(`  ID: ${d.id}, name: ${d2.name}, nameAr: ${d2.nameAr}, deletedAt: ${d2.deletedAt}`);
      });
    } catch (e2) {
      console.log('Fallback also FAILED:', e2.message);
    }
  }

  // 3. Check academicTerms
  console.log('\n--- academicTerms ---');
  try {
    const terms = await db.collection('academicTerms').get();
    console.log(`Found ${terms.size} documents`);
    terms.forEach(d => {
      const d2 = d.data();
      console.log(`  ID: ${d.id}, name: ${d2.name}, nameAr: ${d2.nameAr}, academicYearId: ${d2.academicYearId}, order: ${d2.order}`);
    });
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  // 4. Check admin users
  console.log('\n--- users (admin check) ---');
  try {
    const users = await db.collection('users').limit(5).get();
    console.log(`Found ${users.size} users`);
    users.forEach(d => {
      const d2 = d.data();
      const roleStr = typeof d2.role === 'object' ? JSON.stringify(d2.role) : d2.role;
      console.log(`  ID: ${d.id}, role: ${roleStr}, fullName: ${d2.fullName}`);
    });
  } catch (e) {
    console.log('ERROR:', e.message);
  }

  // 5. List all collections
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
}

main().catch(console.error).finally(() => process.exit(0));
