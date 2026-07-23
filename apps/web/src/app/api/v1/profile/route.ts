import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

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

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    if (!userDoc.exists) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } }, { status: 404 });
    }

    const u = userDoc.data() as Record<string, unknown>;
    const role = extractRole(u.role);

    const baseData: Record<string, unknown> = {
      id: decoded.uid,
      fullName: u.fullName ?? decoded.displayName ?? 'User',
      email: decoded.email ?? null,
      mobileNumber: extractString(u.mobileNumber),
      role,
      status: extractString(typeof u.status === 'object' ? (u.status as Record<string, unknown>).status : u.status) ?? 'active',
      avatarUrl: decoded.photoURL ?? u.avatarUrl ?? null,
      educationalSystem: extractString(u.educationalSystem) ?? extractString(u.educationalSystemId),
      governorate: extractString(u.governorate),
      school: extractString(u.school),
      createdAt: extractString(u.createdAt) ?? new Date().toISOString(),
      updatedAt: extractString(u.updatedAt) ?? new Date().toISOString(),
      roleProfile: {
        stage: u.stageId ? { id: u.stageId as string, name: u.stageName as string ?? u.stageId as string } : null,
        grade: u.gradeId ? { id: u.gradeId as string, name: u.gradeName as string ?? u.gradeId as string } : null,
        currentTerm: u.termId ? { id: u.termId as string, name: u.termName as string ?? u.termId as string } : null,
      },
    };

    return NextResponse.json({ success: true, data: baseData });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid token' } }, { status: 401 });
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Missing Authorization header' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const adminAuth = getAdminAuth();
    const decoded = await adminAuth.verifyIdToken(token);

    const body = (await request.json()) as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const updateData: Record<string, unknown> = { ...body, updatedAt: now };

    if (body.fullName) updateData.fullName = body.fullName;
    if (body.governorate !== undefined) updateData.governorate = body.governorate ?? null;
    if (body.school !== undefined) updateData.school = body.school ?? null;
    if (body.mobileNumber !== undefined) updateData.mobileNumber = body.mobileNumber ?? null;

    await db.collection('users').doc(decoded.uid).update(updateData);

    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const u = userDoc.data() as Record<string, unknown>;
    const role = extractRole(u.role);

    return NextResponse.json({
      success: true,
      data: {
        id: decoded.uid,
        fullName: u.fullName ?? decoded.displayName ?? 'User',
        email: decoded.email ?? null,
        mobileNumber: extractString(u.mobileNumber),
        role,
        status: extractString(typeof u.status === 'object' ? (u.status as Record<string, unknown>).status : u.status) ?? 'active',
        avatarUrl: decoded.photoURL ?? u.avatarUrl ?? null,
        educationalSystem: extractString(u.educationalSystem) ?? extractString(u.educationalSystemId),
        governorate: extractString(u.governorate),
        school: extractString(u.school),
        createdAt: extractString(u.createdAt) ?? new Date().toISOString(),
        updatedAt: extractString(u.updatedAt) ?? new Date().toISOString(),
        roleProfile: {
          stage: u.stageId ? { id: u.stageId as string, name: u.stageName as string ?? u.stageId as string } : null,
          grade: u.gradeId ? { id: u.gradeId as string, name: u.gradeName as string ?? u.gradeId as string } : null,
          currentTerm: u.termId ? { id: u.termId as string, name: u.termName as string ?? u.termId as string } : null,
        },
      },
    });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update profile' } }, { status: 500 });
  }
}
