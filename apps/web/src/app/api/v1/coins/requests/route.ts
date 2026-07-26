import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import { UnlockRequestRepository } from '@el-bannawy/lib';

const requestRepo = new UnlockRequestRepository();

async function getEffectiveUserRole(uid: string): Promise<string> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(uid).get();
    if (doc.exists) {
      const data = doc.data()!;
      const role = (data as Record<string, unknown>).role;
      if (typeof role === 'string') return normalizeRole(role);
      if (role && typeof role === 'object') {
        const nestedRole = (role as Record<string, unknown>).role;
        if (typeof nestedRole === 'string') return normalizeRole(nestedRole);
      }
    }
  } catch {}
  try {
    const firebaseUser = await getAdminAuth().getUser(uid);
    const claims = (firebaseUser.customClaims ?? {}) as Record<string, string>;
    if (claims.role) return normalizeRole(claims.role);
  } catch {}
  return 'student';
}

async function getUserInfo(uid: string): Promise<{ id: string; fullName: string; email: string | null }> {
  try {
    const db = getAdminDb();
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) return { id: uid, fullName: '', email: null };
    const data = doc.data()!;
    return {
      id: uid,
      fullName: (data as Record<string, unknown>).fullName as string || (data as Record<string, unknown>).displayName as string || '',
      email: (data as Record<string, unknown>).email as string || null,
    };
  } catch {
    return { id: uid, fullName: '', email: null };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator' && role !== 'teacher') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    }
    const { searchParams } = new URL(request.url);
    const filter: { status?: string } = {};
    const status = searchParams.get('status');
    if (status) filter.status = status;
    const result = await requestRepo.list(filter);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    const enriched = await Promise.all(
      (result.value ?? []).map(async (r) => {
        const user = await getUserInfo(r.studentId);
        return { ...r, user };
      }),
    );
    return NextResponse.json({ success: true, data: enriched });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    let body: { targetType?: string; targetId?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }
    const targetType = (body.targetType ?? '').toUpperCase();
    const targetId = (body.targetId ?? '').trim();
    if (!targetType || !targetId) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'targetType and targetId are required' } }, { status: 400 });
    }
    if (!['UNIT', 'LESSON'].includes(targetType)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'targetType must be UNIT or LESSON' } }, { status: 400 });
    }
    const now = new Date().toISOString();
    const reqId = `ur_${Date.now()}`;
    const unlockRequest = {
      id: reqId,
      studentId: decoded.uid,
      targetType,
      targetId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    const result = await requestRepo.create(unlockRequest as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
