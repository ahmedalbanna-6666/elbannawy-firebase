import { NextRequest, NextResponse } from 'next/server';
import type { Firestore, DocumentData } from 'firebase-admin/firestore';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

function extractRole(raw: unknown): string {
  if (typeof raw === 'string') return raw.toUpperCase();
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    return typeof r.role === 'string' ? r.role.toUpperCase() : 'STUDENT';
  }
  return 'STUDENT';
}

function extractString(raw: unknown): string | null {
  if (typeof raw === 'string') return raw;
  return null;
}

function getDocName(data: DocumentData | undefined): string {
  if (!data) return '';
  const nameAr: unknown = data.nameAr;
  const name: unknown = data.name;
  return typeof nameAr === 'string' && nameAr.length > 0 ? nameAr : typeof name === 'string' ? name : '';
}

async function resolveAcademicNames(
  db: Firestore,
  gradeId: string | null,
  stageId: string | null,
  termId: string | null,
): Promise<{ stage: { id: string; name: string } | null; grade: { id: string; name: string } | null; currentTerm: { id: string; name: string } | null }> {
  const gradeIdSafe: string | null = gradeId;
  const stageIdSafe: string | null = stageId;
  const termIdSafe: string | null = termId;

  const [gradeDoc, stageDoc, termDoc] = await Promise.all([
    gradeIdSafe ? db.collection('grades').doc(gradeIdSafe).get().catch(() => null) : null,
    stageIdSafe ? db.collection('stages').doc(stageIdSafe).get().catch(() => null) : null,
    termIdSafe ? db.collection('academicTerms').doc(termIdSafe).get().catch(() => null) : null,
  ]);

  const resolvedGrade: { id: string; name: string } | null = gradeDoc?.exists && gradeIdSafe
    ? { id: gradeIdSafe, name: getDocName(gradeDoc.data()) || gradeIdSafe }
    : gradeIdSafe
      ? { id: gradeIdSafe, name: gradeIdSafe }
      : null;

  const resolvedStage: { id: string; name: string } | null = stageDoc?.exists && stageIdSafe
    ? { id: stageIdSafe, name: getDocName(stageDoc.data()) || stageIdSafe }
    : stageIdSafe
      ? { id: stageIdSafe, name: stageIdSafe }
      : null;

  const resolvedTerm: { id: string; name: string } | null = termDoc?.exists && termIdSafe
    ? { id: termIdSafe, name: getDocName(termDoc.data()) || termIdSafe }
    : termIdSafe
      ? { id: termIdSafe, name: termIdSafe }
      : null;

  return { stage: resolvedStage, grade: resolvedGrade, currentTerm: resolvedTerm };
}

async function getProfileData(decoded: { uid: string }): Promise<Record<string, unknown> | null> {
  const adminAuth = getAdminAuth();
  const db = getAdminDb();
  const userDoc = await db.collection('users').doc(decoded.uid).get();

  if (!userDoc.exists) {
    const firebaseUser = await adminAuth.getUser(decoded.uid).catch(() => null);
    if (firebaseUser) {
      const claims = firebaseUser.customClaims ?? {};
      return {
        id: decoded.uid,
        fullName: firebaseUser.displayName ?? 'User',
        email: firebaseUser.email ?? null,
        mobileNumber: null,
        role: extractRole((claims as Record<string, string>).role),
        status: 'active',
        avatarUrl: firebaseUser.photoURL ?? null,
        educationalSystem: null,
        governorate: null,
        school: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        roleProfile: { stage: null, grade: null, currentTerm: null },
      };
    }
    return null;
  }

  const u = userDoc.data() as Record<string, unknown>;
  const role = extractRole(u.role);

  const gradeId = extractString(u.gradeId);
  const stageId = extractString(u.stageId);
  const termId = extractString(u.termId);

  const roleProfile = await resolveAcademicNames(db, gradeId, stageId, termId);

  return {
    id: decoded.uid,
    fullName: u.fullName ?? 'User',
    email: u.email ?? null,
    mobileNumber: extractString(u.mobileNumber),
    role,
    status: extractString(typeof u.status === 'object' ? (u.status as Record<string, unknown>).status : u.status) ?? 'active',
    avatarUrl: u.avatarUrl ?? null,
    educationalSystem: extractString(u.educationalSystem) ?? extractString(u.educationalSystemId),
    governorate: extractString(u.governorate),
    school: extractString(u.school),
    createdAt: extractString(u.createdAt) ?? new Date().toISOString(),
    updatedAt: extractString(u.updatedAt) ?? new Date().toISOString(),
    roleProfile,
  };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const data = await getProfileData(decoded);
    if (!data) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { ...body, updatedAt: now };

    if (body.fullName) updateData.fullName = body.fullName;
    if (body.governorate !== undefined) updateData.governorate = body.governorate ?? null;
    if (body.school !== undefined) updateData.school = body.school ?? null;
    if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber ?? null;

    if (body.gradeId) {
      const gradeDoc = await db.collection('grades').doc(body.gradeId as string).get().catch(() => null);
      if (gradeDoc?.exists) {
        const gradeData = gradeDoc.data();
        if (gradeData) {
          const gsId: unknown = gradeData.stageId;
          if (typeof gsId === 'string') {
            updateData.stageId = gsId;
          }
        }
      }
    }

    await db.collection('users').doc(decoded.uid).update(updateData);

    const data = await getProfileData(decoded);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update profile' } }, { status: 500 });
  }
}
