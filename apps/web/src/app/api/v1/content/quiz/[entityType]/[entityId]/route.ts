import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'contentQuiz';

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

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    const { entityType, entityId } = await params;
    const db = getAdminDb();
    const snap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ success: true, data: null });
    const quiz = { id: snap.docs[0].id, ...snap.docs[0].data() };
    return NextResponse.json({ success: true, data: quiz });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator' && role !== 'teacher') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    const { entityType, entityId } = await params;
    let body: { title?: string; questionCount?: number };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON' } }, { status: 400 });
    }
    const db = getAdminDb();
    const existingSnap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .limit(1)
      .get();
    const batch = db.batch();
    if (!existingSnap.empty) batch.delete(existingSnap.docs[0].ref);
    const id = `cquiz_${Date.now()}`;
    const now = new Date().toISOString();
    const doc = {
      id, entityType: entityType.toUpperCase(), entityId,
      title: body.title ?? 'Untitled Quiz',
      questionCount: body.questionCount ?? 0,
      createdAt: now, updatedAt: now,
    };
    batch.set(db.collection(COLLECTION).doc(id), doc);
    await batch.commit();
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator' && role !== 'teacher') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    const { entityType, entityId } = await params;
    const db = getAdminDb();
    const snap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Quiz not found' } }, { status: 404 });
    await snap.docs[0].ref.delete();
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
