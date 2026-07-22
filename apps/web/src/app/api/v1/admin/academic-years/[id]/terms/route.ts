import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'academicTerms';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id: academicYearId } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const docRef = db.collection(COLLECTION).doc();
    await docRef.set({ ...body, id: docRef.id, academicYearId, createdAt: now, updatedAt: now });
    const saved = await docRef.get();
    return NextResponse.json({ success: true, data: { id: docRef.id, ...saved.data() } }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create term' } }, { status: 500 });
  }
}
