import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { authenticateRequest } from '@/lib/firebase/auth-helper';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required' } }, { status: 401 });
    }
    const adminAuth = (await import('@/lib/firebase/admin')).getAdminAuth();
    const caller = await adminAuth.getUser(decoded.uid);
    const callerRole = ((caller.customClaims as Record<string, string> | undefined)?.role ?? '').toUpperCase();
    if (callerRole !== 'ADMINISTRATOR' && callerRole !== 'ADMIN') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin access required' } }, { status: 403 });
    }

    const body = await request.json() as { permission?: string };
    const db = getAdminDb();
    const docRef = db.collection('userPermissions').doc(id);
    const doc = await docRef.get();
    const existing: string[] = doc.exists ? (doc.data()?.permissions ?? []) : [];
    if (body.permission && !existing.includes(body.permission)) {
      existing.push(body.permission);
    }
    await docRef.set({ permissions: existing, updatedAt: new Date().toISOString() }, { merge: true });
    return NextResponse.json({ success: true, data: { grantedPermissions: existing } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to grant permission' } }, { status: 500 });
  }
}
