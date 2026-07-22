import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'academicYears';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const snapshot = await db.collection(COLLECTION).orderBy('startDate', 'desc').get();
    const items = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({ ...body, id: docRef.id, createdAt: now, updatedAt: now });
    const saved = await docRef.get();
    return NextResponse.json({ success: true, data: { id: docRef.id, ...saved.data() } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create academic year' } }, { status: 500 });
  }
}
