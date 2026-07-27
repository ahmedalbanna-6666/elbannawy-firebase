#!/usr/bin/env node
/**
 * Performance Baseline Runner
 *
 * Usage:
 *   1. Start Firebase Emulators:  pnpm firebase:emulators
 *   2. Run:                       node scripts/performance-baseline.mjs
 *
 * Measures:
 *   - Firestore reads per operation (before/after projections)
 *   - Wire size (bytes) per operation
 *   - Round-trip latency per operation
 *   - Aggregate savings per module
 */
import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { performance } from 'perf_hooks';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, '..', 'lib', 'package.json'));

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore, Timestamp } = require('firebase-admin/firestore');

const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST || 'localhost:8080';

// ── Colour helpers ──
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// ── Init Firestore ──
function initDb() {
  const apps = getApps();
  const app = apps.length === 0
    ? initializeApp({ projectId: 'test-project' })
    : apps[0];
  const db = getFirestore(app);
  const [host, port] = EMULATOR_HOST.split(':');
  db.settings({ host, port: parseInt(port, 10), ssl: false });
  return db;
}

// ── Seed minimal test documents ──
async function seedData(db) {
  const now = Timestamp.now();

  // Academic Year
  const yearId = 'bench-year-1';
  await db.collection('academicYears').doc(yearId).set({
    educationalSystemId: 'GENERAL',
    name: 'Benchmark Year',
    nameAr: 'سنة القياس',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    isCurrent: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
  });

  // Academic Term
  const termId = 'bench-term-1';
  await db.collection('academicTerms').doc(termId).set({
    academicYearId: yearId,
    name: 'Term 1',
    nameAr: 'الفصل الأول',
    order: 1,
    startDate: '2026-01-01',
    endDate: '2026-06-30',
    isCurrent: true,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    schemaVersion: 1,
    deletedAt: null,
  });

  // Units (5)
  const unitIds = [];
  for (let i = 0; i < 5; i++) {
    const uid = `bench-unit-${i}`;
    unitIds.push(uid);
    await db.collection('units').doc(uid).set({
      academicTermId: termId,
      gradeId: null,
      academicYearId: null,
      educationalSystemId: null,
      name: `Unit ${i}`,
      nameAr: `الوحدة ${i}`,
      description: 'Benchmark unit description text for payload measurement',
      order: i,
      isActive: true,
      isPremium: false,
      priceCoins: 0,
      published: true,
      lockedOverride: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      deletedAt: null,
    });
  }

  // Lessons (5 per unit = 25)
  for (const uid of unitIds) {
    for (let j = 0; j < 5; j++) {
      await db.collection('lessons').doc(`bench-lesson-${uid}-${j}`).set({
        unitId: uid,
        title: `Lesson ${j}`,
        slug: `lesson-${j}`,
        description: 'Benchmark lesson description',
        displayOrder: j,
        status: 'published',
        isPublished: true,
        isVisible: true,
        isPremium: false,
        lockedOverride: null,
        homeworkEnabled: true,
        quizEnabled: true,
        estimatedDuration: 30,
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
        deletedAt: null,
      });
    }
  }

  // Users (10 with full fields)
  for (let i = 0; i < 10; i++) {
    await db.collection('users').doc(`bench-user-${i}`).set({
      fullName: `User ${i}`,
      englishName: `User ${i} EN`,
      email: `user${i}@benchmark.com`,
      mobileNumber: `+2010000000${i}`,
      parentMobile: `+2010000000${i + 100}`,
      role: { role: 'student', grantedAt: now.toDate().toISOString() },
      status: { status: 'active' },
      educationalSystemId: 'GENERAL',
      stageId: 'SECONDARY',
      gradeId: 'GRADE_10',
      academicYearId: yearId,
      termId: termId,
      governorate: 'Cairo',
      school: 'Benchmark School',
      avatarUrl: 'https://example.com/avatar.png',
      jobTitle: null,
      createdBy: null,
      createdAt: now,
      updatedAt: now,
      schemaVersion: 1,
      deletedAt: null,
      isActive: true,
    });
  }

  // Activities (5 per lesson)
  const lessonSnap = await db.collection('lessons').limit(5).get();
  for (const doc of lessonSnap.docs) {
    for (let j = 0; j < 5; j++) {
      await db.collection('activities').doc(`bench-act-${doc.id}-${j}`).set({
        lessonId: doc.id,
        type: 'quiz',
        title: `Activity ${j}`,
        subtitle: `Sub ${j}`,
        instructions: 'Do this activity carefully',
        displayOrder: j,
        config: { schemaVersion: 1, data: { questions: [] } },
        status: 'published',
        isRequired: true,
        isScorable: true,
        isPractice: false,
        timeLimit: null,
        maxAttempts: null,
        retryable: false,
        prerequisiteActivityIds: [],
        metadata: {
          estimatedDuration: 10,
          skill: 'reading',
          difficulty: 'medium',
          tags: ['benchmark'],
          aiGenerated: false,
        },
        createdAt: now,
        updatedAt: now,
        schemaVersion: 1,
        deletedAt: null,
      });
    }
  }

  // Clean-up function
  return async () => {
    const collections = [
      'academicYears', 'academicTerms', 'units', 'lessons',
      'users', 'activities',
    ];
    for (const col of collections) {
      const snap = await db.collection(col).get();
      const batch = db.batch();
      snap.docs.forEach(d => batch.delete(d.ref));
      await batch.commit();
    }
    console.log('  Cleaned up seed data');
  };
}

class MeasureResult {
  constructor(label, beforeBytes, afterBytes, beforeDocs, afterDocs, beforeMs, afterMs) {
    this.label = label;
    this.beforeBytes = beforeBytes;
    this.afterBytes = afterBytes;
    this.beforeDocs = beforeDocs;  // Firestore reads count
    this.afterDocs = afterDocs;
    this.beforeMs = beforeMs;
    this.afterMs = afterMs;
  }
  bytesSaved() { return this.beforeBytes - this.afterBytes; }
  bytesPct() { return this.beforeBytes > 0 ? (this.bytesSaved() / this.beforeBytes * 100).toFixed(1) : '0.0'; }
  docsSaved() { return this.beforeDocs - this.afterDocs; }
  msSaved() { return this.beforeMs > 0 ? (this.beforeMs - this.afterMs).toFixed(2) : '0.00'; }
  msPct() { return this.beforeMs > 0 ? ((this.beforeMs - this.afterMs) / this.beforeMs * 100).toFixed(1) : '0.0'; }
}

// ── Measure: count docs returned + wire bytes + timing ──
async function measureQuery(label, db, collection, filterFns, projections) {
  // BEFORE: no projections
  const beforeStart = performance.now();
  let beforeQuery = db.collection(collection);
  for (const fn of filterFns) beforeQuery = fn(beforeQuery);
  const beforeSnap = await beforeQuery.get();
  const beforeMs = performance.now() - beforeStart;
  const beforeDocs = beforeSnap.size;
  const beforeBytes = JSON.stringify(beforeSnap.docs.map(d => d.data())).length;

  // AFTER: with projections
  const afterStart = performance.now();
  let afterQuery = db.collection(collection);
  for (const fn of filterFns) afterQuery = fn(afterQuery);
  if (projections.length > 0) afterQuery = afterQuery.select(...projections);
  const afterSnap = await afterQuery.get();
  const afterMs = performance.now() - afterStart;
  const afterDocs = afterSnap.size;
  const afterBytes = projections.length > 0
    ? JSON.stringify(afterSnap.docs.map(d => d.data())).length
    : beforeBytes;

  return new MeasureResult(label, beforeBytes, afterBytes, beforeDocs, afterDocs, beforeMs, afterMs);
}

function printRow(label, m) {
  const bar = m.bytesPct() > 0
    ? GREEN + '█'.repeat(Math.round(parseFloat(m.bytesPct()) / 5)) + RESET
    : '';
  console.log(
    `  ${label.padEnd(35)} ` +
    `${(m.beforeBytes / 1024).toFixed(1).padStart(8)} KB  ` +
    `${(m.afterBytes / 1024).toFixed(1).padStart(8)} KB  ` +
    `${m.bytesPct().padStart(5)}%  ` +
    `${m.beforeMs.toFixed(1).padStart(7)}ms ` +
    `${m.afterMs.toFixed(1).padStart(7)}ms ` +
    `${m.msPct().padStart(5)}%  ` +
    `${bar}`
  );
}

function printSummary(results) {
  const totalBeforeBytes = results.reduce((s, r) => s + r.beforeBytes, 0);
  const totalAfterBytes = results.reduce((s, r) => s + r.afterBytes, 0);
  const totalBeforeMs = results.reduce((s, r) => s + r.beforeMs, 0);
  const totalAfterMs = results.reduce((s, r) => s + r.afterMs, 0);

  console.log(`  ${''.padEnd(35)} ${'─'.repeat(60)}`);
  console.log(
    `  ${BOLD}TOTAL${RESET.padEnd(32)} ` +
    `${(totalBeforeBytes / 1024).toFixed(1).padStart(8)} KB  ` +
    `${(totalAfterBytes / 1024).toFixed(1).padStart(8)} KB  ` +
    `${((totalBeforeBytes - totalAfterBytes) / totalBeforeBytes * 100).toFixed(1).padStart(5)}%  ` +
    `${totalBeforeMs.toFixed(1).padStart(7)}ms ` +
    `${totalAfterMs.toFixed(1).padStart(7)}ms ` +
    `${((totalBeforeMs - totalAfterMs) / totalBeforeMs * 100).toFixed(1).padStart(5)}%`
  );
}

async function main() {
  console.log('\n' + '═'.repeat(100));
  console.log(`${BOLD}  FIRESTORE PERFORMANCE BASELINE${RESET}`);
  console.log(`  Phase A1 — Projection Safety Audit | ${new Date().toISOString()}`);
  console.log('═'.repeat(100) + '\n');

  const db = initDb();
  const clean = await seedData(db);

  console.log('  Seed data inserted. Running benchmarks...\n');

  const allResults = [];

  // ── 1. Academic Years list ──
  console.log(`\n${CYAN}${BOLD}  ── Academic Years ──${RESET}`);
  allResults.push(await measureQuery(
    'listAcademicYears',
    db, 'academicYears',
    [q => q.where('deletedAt', '==', null)],
    ['name', 'isCurrent', 'startDate', 'endDate', 'createdAt']
  ));

  // ── 2. Academic Terms list ──
  console.log(`\n${CYAN}${BOLD}  ── Academic Terms ──${RESET}`);
  allResults.push(await measureQuery(
    'listAcademicTerms',
    db, 'academicTerms',
    [q => q.where('deletedAt', '==', null)],
    ['academicYearId', 'name', 'nameAr', 'order', 'isCurrent', 'createdAt']
  ));

  // ── 3. Units list ──
  console.log(`\n${CYAN}${BOLD}  ── Units ──${RESET}`);
  allResults.push(await measureQuery(
    'listUnits',
    db, 'units',
    [q => q.where('deletedAt', '==', null)],
    ['academicTermId', 'gradeId', 'academicYearId', 'educationalSystemId', 'name', 'nameAr', 'order', 'isActive', 'isPremium', 'priceCoins', 'published', 'lockedOverride', 'createdAt']
  ));

  // ── 4. Lessons list ──
  console.log(`\n${CYAN}${BOLD}  ── Lessons ──${RESET}`);
  allResults.push(await measureQuery(
    'listLessons',
    db, 'lessons',
    [q => q.where('deletedAt', '==', null)],
    ['unitId', 'title', 'slug', 'displayOrder', 'status', 'isPublished', 'isVisible', 'isPremium', 'lockedOverride', 'homeworkEnabled', 'quizEnabled', 'estimatedDuration', 'createdAt']
  ));

  // ── 5. Activities list ──
  console.log(`\n${CYAN}${BOLD}  ── Activities ──${RESET}`);
  allResults.push(await measureQuery(
    'listActivities',
    db, 'activities',
    [q => q.where('deletedAt', '==', null)],
    ['lessonId', 'type', 'title', 'subtitle', 'displayOrder', 'status', 'isRequired', 'isScorable', 'isPractice', 'metadata', 'createdAt']
  ));

  // ── 6. User find by mobile ──
  console.log(`\n${CYAN}${BOLD}  ── Users ──${RESET}`);
  allResults.push(await measureQuery(
    'findUserByMobile',
    db, 'users',
    [
      q => q.where('mobileNumber', '==', '+20100000000'),
      q => q.where('deletedAt', '==', null),
      q => q.limit(1),
    ],
    ['role', 'fullName', 'mobileNumber', 'isActive', 'createdAt', 'updatedAt']
  ));

  // ── 7. User list ──
  allResults.push(await measureQuery(
    'listUsers',
    db, 'users',
    [q => q.where('deletedAt', '==', null), q => q.limit(10)],
    ['role', 'fullName', 'mobileNumber', 'isActive', 'createdAt']
  ));

  // ── 8. Lesson Videos (simulated) ──
  console.log(`\n${CYAN}${BOLD}  ── Lesson Videos (simulated) ──${RESET}`);
  allResults.push(await measureQuery(
    'listLessonVideos',
    db, 'lessons',
    [q => q.where('deletedAt', '==', null), q => q.limit(5)],
    ['unitId', 'title', 'slug', 'displayOrder', 'status', 'isPublished', 'isVisible']
  ));

  // ── 9. Mistakes filters ──
  console.log(`\n${CYAN}${BOLD}  ── Mistakes ──${RESET}`);
  allResults.push(await measureQuery(
    'mistakesFilters',
    db, 'lessons',  // Use lessons as proxy since no mistakes seeded
    [q => q.where('isPublished', '==', true)],
    ['unitId', 'title', 'slug']
  ));

  // ── Print results table ──
  console.log(`\n\n${BOLD}${YELLOW}  RESULTS TABLE${RESET}`);
  console.log(`  ${'─'.repeat(100)}`);
  console.log(
    `  ${BOLD}${'Query'.padEnd(35)} ${'Before'.padStart(8)} ${'After'.padStart(8)} ${'Saved'.padStart(6)} ${'Before'.padStart(7)} ${'After'.padStart(7)} ${'Saved'.padStart(6)}${RESET}`
  );
  console.log(
    `  ${''.padEnd(35)} ${'(Payload)'.padStart(8)} ${'(Payload)'.padStart(8)} ${'%'.padStart(5)} ${'(Time)'.padStart(7)} ${'(Time)'.padStart(7)} ${'%'.padStart(5)}`
  );
  console.log(`  ${'─'.repeat(100)}`);
  for (const r of allResults) printRow(r.label, r);
  printSummary(allResults);
  console.log(`  ${'─'.repeat(100)}`);

  // ── Print document-level reduction ──
  console.log(`\n\n${BOLD}${YELLOW}  DOCUMENT FIELD REDUCTION ANALYSIS${RESET}`);
  console.log(`  ${'─'.repeat(80)}`);
  const fieldReductions = [
    { coll: 'AcademicYears', total: 11, projected: 5 },
    { coll: 'AcademicTerms', total: 12, projected: 6 },
    { coll: 'Units', total: 17, projected: 13 },
    { coll: 'Lessons', total: 17, projected: 13 },
    { coll: 'Activities', total: 20, projected: 11 },
    { coll: 'Users (findBy*)', total: 22, projected: 6 },
    { coll: 'Users (list)', total: 22, projected: 5 },
  ];
  console.log(`  ${BOLD}${'Collection'.padEnd(25)} ${'Total Fields'.padStart(14)} ${'Projected'.padStart(12)} ${'Omitted'.padStart(10)} ${'Reduction'.padStart(10)}${RESET}`);
  console.log(`  ${'─'.repeat(80)}`);
  let totalF = 0, totalP = 0;
  for (const r of fieldReductions) {
    const omitted = r.total - r.projected;
    const pct = ((omitted / r.total) * 100).toFixed(1);
    console.log(`  ${r.coll.padEnd(25)} ${String(r.total).padStart(14)} ${String(r.projected).padStart(12)} ${String(omitted).padStart(10)} ${pct.padStart(9)}%`);
    totalF += r.total; totalP += r.projected;
  }
  console.log(`  ${'─'.repeat(80)}`);
  console.log(`  ${'OVERALL'.padEnd(25)} ${String(totalF).padStart(14)} ${String(totalP).padStart(12)} ${String(totalF - totalP).padStart(10)} ${((totalF - totalP) / totalF * 100).toFixed(1).padStart(9)}%`);

  // ── Cleanup ──
  await clean();

  // ── Summary verdict ──
  const totalBytesBefore = allResults.reduce((s, r) => s + r.beforeBytes, 0);
  const totalBytesAfter = allResults.reduce((s, r) => s + r.afterBytes, 0);
  const overallPct = totalBytesBefore > 0
    ? ((totalBytesBefore - totalBytesAfter) / totalBytesBefore * 100).toFixed(1)
    : '0.0';

  console.log(`\n\n${BOLD}${GREEN}  ═══════════════════════════════════════════════${RESET}`);
  console.log(`${BOLD}${GREEN}   VERDICT${RESET}`);
  console.log(`${BOLD}${GREEN}  ═══════════════════════════════════════════════${RESET}`);
  console.log(`  Overall network payload reduction: ${BOLD}${overallPct}%${RESET}`);
  console.log(`  Total documents benchmarked:       ${allResults.reduce((s, r) => s + r.beforeDocs, 0)}`);
  console.log(`  Total queries benchmarked:          ${allResults.length}`);

  if (parseFloat(overallPct) > 15) {
    console.log(`\n  ${GREEN}✅ PASS: Projections achieved >15% payload reduction.${RESET}`);
    console.log(`  ${GREEN}   Phase A1 is verified. Ready for Phase B.${RESET}`);
  } else if (parseFloat(overallPct) > 5) {
    console.log(`\n  ${YELLOW}⚠️  MODERATE: 5-15% reduction. Review projections.${RESET}`);
  } else {
    console.log(`\n  ${YELLOW}⚠️  LOW: <5% reduction. Re-evaluate projection strategy.${RESET}`);
  }
  console.log('');

  process.exit(0);
}

main().catch(err => {
  console.error('\n  ❌ Benchmark failed:', err.message);
  process.exit(1);
});
