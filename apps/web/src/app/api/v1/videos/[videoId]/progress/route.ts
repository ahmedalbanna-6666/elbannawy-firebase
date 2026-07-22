import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb, getAdminAuth } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
): Promise<NextResponse> {
  const { videoId } = await params;
  try {
    const authHeader = _request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const db = getAdminDb();
    const doc = await db.collection('videoProgress').doc(decoded.uid + '_' + videoId).get();
    if (!doc.exists) {
      return NextResponse.json({ success: true, data: { watchedSeconds: 0, completed: false, lastPosition: 0 } });
    }
    const d = doc.data()!;
    return NextResponse.json({ success: true, data: { watchedSeconds: d.watchedSeconds ?? 0, completed: d.completed ?? false, lastPosition: d.lastPosition ?? 0 } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch progress' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ videoId: string }> },
): Promise<NextResponse> {
  const { videoId } = await params;
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }
    const token = authHeader.slice(7);
    const decoded = await getAdminAuth().verifyIdToken(token);
    const body: { watchedSeconds?: number; completed?: boolean; lastPosition?: number } = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const docId = decoded.uid + '_' + videoId;
    const existing = await db.collection('videoProgress').doc(docId).get();
    const now = new Date().toISOString();
    if (existing.exists) {
      await db.collection('videoProgress').doc(docId).update({ ...body, updatedAt: now });
    } else {
      await db.collection('videoProgress').doc(docId).set({ ...body, userId: decoded.uid, videoId, createdAt: now, updatedAt: now });
    }
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to save progress' } }, { status: 500 });
  }
}
