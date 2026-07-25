#!/usr/bin/env node

/**
 * Data Integrity Audit Script
 * 
 * Run: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/data-audit.mjs
 * 
 * Checks:
 * 1. Users with non-existent gradeId
 * 2. TeacherAssignments with non-existent gradeId
 * 3. Units referencing non-existent gradeId
 * 4. Lessons linked to deleted/non-existent Unit
 * 5. AcademicYears not used by any Term
 * 6. AcademicTerms without valid academicYearId
 */

import { createRequire } from 'module';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(resolve(__dirname, '..', 'lib', 'package.json'));

const { initializeApp, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

// ── Known valid static IDs (mirrors lib/domain/curriculum/constants/) ──

const VALID_GRADE_IDS = new Set([
  'GRADE_1', 'GRADE_2', 'GRADE_3', 'GRADE_4', 'GRADE_5', 'GRADE_6',
  'GRADE_7', 'GRADE_8', 'GRADE_9', 'GRADE_10', 'GRADE_11', 'GRADE_12',
]);

const VALID_STAGE_IDS = new Set(['PRIMARY', 'PREPARATORY', 'SECONDARY']);

const VALID_SYSTEM_IDS = new Set(['GENERAL', 'LANGUAGE', 'INTERNATIONAL']);

// ── Firebase Init ──

function initFirestore() {
  const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
  if (!emulatorHost) {
    throw new Error('FIRESTORE_EMULATOR_HOST not set. Run: FIRESTORE_EMULATOR_HOST=localhost:8080 node scripts/data-audit.mjs');
  }
  const apps = getApps();
  const app = apps.length === 0
    ? initializeApp({ projectId: 'test-project' })
    : apps[0];
  const db = getFirestore(app);
  const parts = emulatorHost.split(':');
  db.settings({
    host: parts[0] ?? 'localhost',
    port: parseInt(parts[1] ?? '8080', 10),
    ssl: false,
  });
  return db;
}

// ── Helpers ──

const PASS = '\x1b[32m✓ PASS\x1b[0m';
const FAIL = '\x1b[31m✗ FAIL\x1b[0m';
const INFO = '\x1b[34mℹ INFO\x1b[0m';

function printResult(checkName, ok, details) {
  console.log(`  ${ok ? PASS : FAIL} ${checkName}${details ? `\n         ${details}` : ''}`);
}

// ── Checks ──

/** Check 1: Users with gradeId that is not in the known set */
async function checkUserGradeIds(db) {
  const issues = [];
  const snap = await db.collection('users').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.gradeId && !VALID_GRADE_IDS.has(data.gradeId)) {
      issues.push(`User ${doc.id} has invalid gradeId: "${data.gradeId}"`);
    }
  }
  return issues;
}

/** Check 2: TeacherAssignments with invalid gradeId */
async function checkTeacherAssignmentGradeIds(db) {
  const issues = [];
  const collections = await db.listCollections();
  const hasTeacherAssignments = collections.some(c => c.id === 'teacherAssignments');
  if (!hasTeacherAssignments) {
    return { skipped: true, issues: [] };
  }
  const snap = await db.collection('teacherAssignments').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.gradeId && !VALID_GRADE_IDS.has(data.gradeId)) {
      issues.push(`TeacherAssignment ${doc.id} references invalid gradeId: "${data.gradeId}"`);
    }
  }
  return { skipped: false, issues };
}

/** Check 3: Units with invalid gradeId */
async function checkUnitGradeIds(db) {
  const issues = [];
  const snap = await db.collection('units').get();
  for (const doc of snap.docs) {
    const data = doc.data();
    if (data.gradeId && !VALID_GRADE_IDS.has(data.gradeId)) {
      issues.push(`Unit ${doc.id} references invalid gradeId: "${data.gradeId}"`);
    }
  }
  return issues;
}

/** Check 4: Lessons referencing non-existent (or soft-deleted) units */
async function checkLessonUnitRefs(db) {
  const issues = [];
  const unitSnap = await db.collection('units').get();
  const validUnitIds = new Set();
  for (const doc of unitSnap.docs) {
    const data = doc.data();
    if (!data.deletedAt) {
      validUnitIds.add(doc.id);
    }
  }
  const lessonSnap = await db.collection('lessons').get();
  for (const doc of lessonSnap.docs) {
    const data = doc.data();
    if (data.unitId) {
      if (!validUnitIds.has(data.unitId)) {
        const exists = unitSnap.docs.some(u => u.id === data.unitId);
        if (!exists) {
          issues.push(`Lesson ${doc.id} references non-existent unit: "${data.unitId}"`);
        } else {
          issues.push(`Lesson ${doc.id} references soft-deleted unit: "${data.unitId}"`);
        }
      }
    }
  }
  return issues;
}

/** Check 5: AcademicYears not referenced by any AcademicTerm */
async function checkUnusedAcademicYears(db) {
  const issues = [];
  const yearSnap = await db.collection('academicYears').get();
  const termSnap = await db.collection('academicTerms').get();
  const referencedYearIds = new Set();
  for (const doc of termSnap.docs) {
    const data = doc.data();
    if (data.academicYearId) {
      referencedYearIds.add(data.academicYearId);
    }
  }
  for (const doc of yearSnap.docs) {
    if (!referencedYearIds.has(doc.id) && !doc.data().deletedAt) {
      issues.push(`AcademicYear ${doc.id} (${doc.data().name || doc.data().nameAr || ''}) has no terms referencing it`);
    }
  }
  return issues;
}

/** Check 6: AcademicTerms without a valid (non-deleted) academicYear */
async function checkTermAcademicYearRefs(db) {
  const issues = [];
  const yearSnap = await db.collection('academicYears').get();
  const validYearIds = new Set();
  for (const doc of yearSnap.docs) {
    if (!doc.data().deletedAt) {
      validYearIds.add(doc.id);
    }
  }
  const termSnap = await db.collection('academicTerms').get();
  for (const doc of termSnap.docs) {
    const data = doc.data();
    if (!data.academicYearId) {
      issues.push(`AcademicTerm ${doc.id} has no academicYearId`);
    } else if (!validYearIds.has(data.academicYearId)) {
      const exists = yearSnap.docs.some(y => y.id === data.academicYearId);
      if (!exists) {
        issues.push(`AcademicTerm ${doc.id} references non-existent academicYear: "${data.academicYearId}"`);
      } else {
        issues.push(`AcademicTerm ${doc.id} references soft-deleted academicYear: "${data.academicYearId}"`);
      }
    }
  }
  return issues;
}

// ── Main ──

async function main() {
  console.log('\n═══════════════════════════════════════════════');
  console.log('  Data Integrity Audit');
  console.log('═══════════════════════════════════════════════\n');

  const db = initFirestore();

  let totalIssues = 0;

  // Check 1
  console.log('📋 [1/6] Users with non-existent gradeId');
  const c1 = await checkUserGradeIds(db);
  printResult('Users gradeId audit', c1.length === 0, c1.length > 0 ? c1.join('\n         ') : '');
  totalIssues += c1.length;

  // Check 2
  console.log('\n📋 [2/6] TeacherAssignments with non-existent gradeId');
  const c2 = await checkTeacherAssignmentGradeIds(db);
  if (c2.skipped) {
    console.log(`  ${INFO} TeacherAssignments collection does not exist (skipped)`);
  } else {
    printResult('TeacherAssignment gradeId audit', c2.issues.length === 0, c2.issues.length > 0 ? c2.issues.join('\n         ') : '');
    totalIssues += c2.issues.length;
  }

  // Check 3
  console.log('\n📋 [3/6] Units with non-existent gradeId');
  const c3 = await checkUnitGradeIds(db);
  printResult('Units gradeId audit', c3.length === 0, c3.length > 0 ? c3.join('\n         ') : '');
  totalIssues += c3.length;

  // Check 4
  console.log('\n📋 [4/6] Lessons linked to deleted/non-existent Unit');
  const c4 = await checkLessonUnitRefs(db);
  printResult('Lessons unitId audit', c4.length === 0, c4.length > 0 ? c4.join('\n         ') : '');
  totalIssues += c4.length;

  // Check 5
  console.log('\n📋 [5/6] AcademicYears not used by any Term');
  const c5 = await checkUnusedAcademicYears(db);
  printResult('AcademicYear usage audit', c5.length === 0, c5.length > 0 ? c5.join('\n         ') : '');
  totalIssues += c5.length;

  // Check 6
  console.log('\n📋 [6/6] AcademicTerms without valid AcademicYear');
  const c6 = await checkTermAcademicYearRefs(db);
  printResult('AcademicTerm year ref audit', c6.length === 0, c6.length > 0 ? c6.join('\n         ') : '');
  totalIssues += c6.length;

  // Summary
  console.log('\n───────────────────────────────────────────────');
  if (totalIssues === 0) {
    console.log('  ✅ ALL CHECKS PASSED — No data integrity issues found.');
  } else {
    console.log(`  ❌ ${totalIssues} issue${totalIssues !== 1 ? 's' : ''} found. Review details above.`);
  }
  console.log('───────────────────────────────────────────────\n');

  process.exit(totalIssues > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n  ❌ Audit script failed:', err.message, '\n');
  process.exit(1);
});
