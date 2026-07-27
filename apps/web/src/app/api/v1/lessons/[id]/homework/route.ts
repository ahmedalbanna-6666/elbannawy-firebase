import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const existing = await db.collection('homework').where('lessonId', '==', id).limit(1).get();
    if (!existing.empty) {
      const doc = existing.docs.at(0);
      if (doc) await doc.ref.delete();
    }
    return NextResponse.json({ success: true, data: null, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const snap = await db.collection('homework').where('lessonId', '==', id).limit(1).get();
    if (snap.empty) {
      return NextResponse.json({ success: true, data: null });
    }
    const first = snap.docs.at(0);
    if (!first) return NextResponse.json({ success: true, data: null });
    const doc = { id: first.id, ...first.data() };
    return NextResponse.json({ success: true, data: doc });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' }, timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
