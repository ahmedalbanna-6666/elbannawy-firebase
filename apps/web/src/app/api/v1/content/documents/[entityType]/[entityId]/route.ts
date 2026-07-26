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
    const snap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .orderBy('createdAt', 'desc')
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ success: true, data: null });
    const doc = { id: snap.docs[0].id, ...snap.docs[0].data() };
    return NextResponse.json({ success: true, data: doc });
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
    const contentType = request.headers.get('content-type') ?? '';
    const db = getAdminDb();
    const id = `cdoc_${Date.now()}`;
    const now = new Date().toISOString();
    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      const storagePath = (formData.get('storagePath') as string) ?? '';
      const fileName = file?.name ?? (formData.get('fileName') as string) ?? '';
      const mimeType = file?.type ?? (formData.get('mimeType') as string) ?? 'application/octet-stream';
      const fileSize = file?.size ?? Number(formData.get('fileSize') ?? 0);
      const existingSnap = await db.collection(COLLECTION)
        .where('entityType', '==', entityType.toUpperCase())
        .where('entityId', '==', entityId)
        .limit(1)
        .get();
      const batch = db.batch();
      if (!existingSnap.empty) batch.delete(existingSnap.docs[0].ref);
      const doc = { id, entityType: entityType.toUpperCase(), entityId, storagePath, fileName, mimeType, fileSize, createdAt: now, updatedAt: now };
      batch.set(db.collection(COLLECTION).doc(id), doc);
      await batch.commit();
      return NextResponse.json({ success: true, data: doc }, { status: 201 });
    }
    let body: { storagePath?: string; fileName?: string; mimeType?: string; fileSize?: number };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON' } }, { status: 400 });
    }
    if (!body.storagePath) return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'storagePath is required' } }, { status: 400 });
    const existingSnap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .limit(1)
      .get();
    const batch = db.batch();
    if (!existingSnap.empty) batch.delete(existingSnap.docs[0].ref);
    const doc = {
      id, entityType: entityType.toUpperCase(), entityId,
      storagePath: body.storagePath,
      fileName: body.fileName ?? '',
      mimeType: body.mimeType ?? 'application/octet-stream',
      fileSize: body.fileSize ?? 0,
      createdAt: now, updatedAt: now,
    };
    batch.set(db.collection(COLLECTION).doc(id), doc);
    await batch.commit();
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
    const snap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .limit(1)
      .get();
    if (snap.empty) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } }, { status: 404 });
    const ref = snap.docs[0].ref;
    const updates = { ...body, updatedAt: new Date().toISOString() } as Record<string, unknown>;
    delete updates.id;
    delete updates.entityType;
    delete updates.entityId;
    delete updates.createdAt;
    await ref.update(updates);
    const updated = { id: ref.id, ...(await ref.get()).data() };
    return NextResponse.json({ success: true, data: updated });
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
    if (snap.empty) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Document not found' } }, { status: 404 });
    await snap.docs[0].ref.delete();
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
