import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

const COLLECTION = 'academicTerms';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    await db.collection(COLLECTION).doc(id).update({ ...body, updatedAt: new Date().toISOString() });
    return NextResponse.json({ success: true, data: { id, ...body } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update term' } }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    await db.collection(COLLECTION).doc(id).delete();
    return NextResponse.json({ success: true, data: null });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to delete term' } }, { status: 500 });
  }
}
