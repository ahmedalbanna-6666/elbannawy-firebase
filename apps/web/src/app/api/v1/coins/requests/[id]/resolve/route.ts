import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';
import {
  UnlockRequestRepository,
  ContentEntitlementRepository,
} from '@el-bannawy/lib';

const requestRepo = new UnlockRequestRepository();
const entitlementRepo = new ContentEntitlementRepository();

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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }
    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator' && role !== 'teacher') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    }
    const { id } = await params;
    let body: { status?: string; adminNote?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }
    const status = body.status ?? '';
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'status must be APPROVED or REJECTED' } }, { status: 400 });
    }
    const existing = await requestRepo.getById(id);
    if (!existing.ok || !existing.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Request not found' } }, { status: 404 });
    }
    if (existing.value.status !== 'PENDING') {
      return NextResponse.json({ success: false, error: { code: 'PRECONDITION_FAILED', message: 'Request already resolved' } }, { status: 412 });
    }
    const now = new Date().toISOString();
    await requestRepo.update(id, { status, adminNote: body.adminNote || '', reviewedBy: decoded.uid, reviewedAt: now } as any);
    if (status === 'APPROVED') {
      const entitlement = {
        id: `ent_${Date.now()}`,
        studentId: existing.value.studentId,
        contentType: existing.value.targetType,
        contentId: existing.value.targetId,
        sourceType: 'unlock_request',
        sourceId: id,
        active: true,
        activatedAt: now,
      };
      await entitlementRepo.create(entitlement as any);
    }
    return NextResponse.json({ success: true, data: { id, status } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
