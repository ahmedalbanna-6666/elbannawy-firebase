import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'contentDocuments';

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
    const snap = await db.collection(COLLECTION).where('entityId', '==', entityId).get();
    const docs = snap.docs
      .map(d => ({ id: d.id, ...d.data() } as Record<string, unknown>))
      .filter(d => (d.entityType as string) === entityType.toUpperCase())
      .sort((a, b) => ((b.createdAt as string) ?? '').localeCompare((a.createdAt as string) ?? ''));
    const response = NextResponse.json({ success: true, data: docs.length > 0 ? docs[0] : null });
    response.headers.set('Cache-Control', 'public, max-age=300');
    return response;
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
    let body: { storagePath?: string; fileName?: string; mimeType?: string; fileSize?: number };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON' } }, { status: 400 });
    }
    const db = getAdminDb();
    const existingSnap = await db.collection(COLLECTION).where('entityId', '==', entityId).select('entityType').get();
    const existing = existingSnap.docs.find(d => d.data().entityType === entityType.toUpperCase());
    if (existing) await existing.ref.delete();
    const now = new Date().toISOString();
    const id = `cdoc_${Date.now()}`;
    const doc = {
      id, entityType: entityType.toUpperCase(), entityId,
      storagePath: body.storagePath ?? '',
      fileName: body.fileName ?? 'untitled',
      mimeType: body.mimeType ?? 'application/pdf',
      fileSize: body.fileSize ?? 0,
      downloadable: true,
      createdAt: now, updatedAt: now,
    };
    await db.collection(COLLECTION).doc(id).set(doc);
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ entityType: string; entityId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    const role = await getEffectiveUserRole(decoded.uid);
    if (role !== 'administrator' && role !== 'teacher') return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Admin or teacher only' } }, { status: 403 });
    const { entityType, entityId } = await params;
    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON' } }, { status: 400 });
    }
    const db = getAdminDb();
    const snap = await db.collection(COLLECTION).where('entityId', '==', entityId).select('entityType').get();
    const existing = snap.docs.find(d => d.data().entityType === entityType.toUpperCase());
    if (!existing) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } }, { status: 404 });
    const updates: Record<string, unknown> = { ...body, updatedAt: new Date().toISOString() };
    const allowed = ['storagePath', 'fileName', 'mimeType', 'fileSize', 'downloadable'];
    for (const key of Object.keys(updates)) {
      if (!allowed.includes(key) && key !== 'updatedAt') delete updates[key];
    }
    await existing.ref.update(updates);
    return NextResponse.json({ success: true, data: { id: existing.id, ...updates } });
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
    const snap = await db.collection(COLLECTION).where('entityId', '==', entityId).select('entityType').get();
    const existing = snap.docs.find(d => d.data().entityType === entityType.toUpperCase());
    if (!existing) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } }, { status: 404 });
    await existing.ref.delete();
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
