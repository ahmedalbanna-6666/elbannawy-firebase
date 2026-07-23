import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { status?: string; reason?: string };
    const db = getAdminDb();
    const docRef = db.collection('users').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Teacher not found' } }, { status: 404 });

    const statusVal = (body.status ?? 'active').toLowerCase();
    const updateData: Record<string, unknown> = { status: statusVal, updatedAt: new Date().toISOString() };

    if (statusVal === 'deleted') {
      updateData.deletedAt = new Date().toISOString();
      updateData.isActive = false;
    } else if (statusVal === 'active') {
      updateData.deletedAt = null;
      updateData.isActive = true;
    } else {
      updateData.isActive = false;
    }

    await docRef.update(updateData);
    return NextResponse.json({ success: true, data: { id, status: statusVal } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update status' } }, { status: 500 });
  }
}
