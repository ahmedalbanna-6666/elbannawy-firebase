import { NextRequest, NextResponse } from 'next/server';
import { GRADES, STAGES } from '@el-bannawy/lib';
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

function resolveAcademicNames(
  gradeId: string | null,
  stageId: string | null,
  termId: string | null,
): { stage: { id: string; name: string } | null; grade: { id: string; name: string } | null; currentTerm: { id: string; name: string } | null } {
  const resolvedGrade: { id: string; name: string } | null = gradeId
    ? { id: gradeId, name: GRADES.find((g) => g.id === gradeId)?.nameAr ?? gradeId }
    : null;

  const resolvedStage: { id: string; name: string } | null = stageId
    ? { id: stageId, name: STAGES.find((s) => s.id === stageId)?.nameAr ?? stageId }
    : null;

  const resolvedTerm: { id: string; name: string } | null = termId
    ? { id: termId, name: termId }
    : null;

  return { stage: resolvedStage, grade: resolvedGrade, currentTerm: resolvedTerm };
}

async function resolveTermName(db: ReturnType<typeof getAdminDb>, termId: string): Promise<string> {
  try {
    const termDoc = await db.collection('academicTerms').doc(termId).get();
    if (termDoc.exists) {
      const data = termDoc.data() as { name?: string; nameAr?: string } | undefined;
      return data?.nameAr ?? data?.name ?? termId;
    }
  } catch {
    // fall through to return termId
  }
  return termId;
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

  const roleProfile = resolveAcademicNames(gradeId, stageId, termId);
  if (roleProfile.currentTerm && termId) {
    roleProfile.currentTerm.name = await resolveTermName(db, termId);
  }

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
  let decoded: { uid: string };
  try {
    const result = await authenticateRequest(request);
    if (!result) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    decoded = result;
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
  }

  try {
    const data = await getProfileData(decoded);
    if (!data) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Internal server error' } }, { status: 500 });
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
      const grade = GRADES.find((g) => g.id === body.gradeId);
      if (grade) {
        updateData.stageId = grade.stageId;
      }
    }

    await db.collection('users').doc(decoded.uid).update(updateData);

    const data = await getProfileData(decoded);
    return NextResponse.json({ success: true, data });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update profile' } }, { status: 500 });
  }
}
