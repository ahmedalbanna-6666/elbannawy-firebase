import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest, normalizeRole } from '@/lib/firebase/auth-helper';
import { getAdminAuth, getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'contentVideos';

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
      .orderBy('displayOrder', 'asc')
      .get();
    const videos = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data: videos });
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
    let body: { youtubeUrl?: string; title?: string };
    try { body = await request.json() as typeof body; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON' } }, { status: 400 });
    }
    const youtubeUrl = (body.youtubeUrl ?? '').trim();
    if (!youtubeUrl) return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'youtubeUrl is required' } }, { status: 400 });
    const match = youtubeUrl.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    const youtubeId = match?.[1] ?? '';
    if (!youtubeId) return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid YouTube URL' } }, { status: 400 });
    const db = getAdminDb();
    const existingSnap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .where('providerVideoId', '==', youtubeId)
      .limit(1)
      .get();
    if (!existingSnap.empty) return NextResponse.json({ success: false, error: { code: 'CONFLICT', message: 'Video already exists' } }, { status: 409 });
    const maxOrderSnap = await db.collection(COLLECTION)
      .where('entityType', '==', entityType.toUpperCase())
      .where('entityId', '==', entityId)
      .orderBy('displayOrder', 'desc')
      .limit(1)
      .get();
    const maxOrder = maxOrderSnap.empty ? 0 : (maxOrderSnap.docs[0]?.data()?.displayOrder as number ?? 0);
    const now = new Date().toISOString();
    const id = `cvid_${Date.now()}`;
    const doc = {
      id,
      entityType: entityType.toUpperCase(),
      entityId,
      title: body.title ?? `Video ${maxOrder + 1}`,
      youtubeUrl,
      youtubeId,
      providerName: 'youtube',
      providerVideoId: youtubeId,
      providerUrl: youtubeUrl,
      duration: 0,
      displayOrder: maxOrder + 1,
      createdAt: now,
      updatedAt: now,
    };
    await db.collection(COLLECTION).doc(id).set(doc);
    return NextResponse.json({ success: true, data: doc }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
