import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { mobileNumber?: string };
    if (!body.mobileNumber) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'mobileNumber is required' } }, { status: 400 });
    }
    const db = getAdminDb();
    await db.collection('users').doc(id).update({
      mobileNumber: body.mobileNumber,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, data: { id, mobileNumber: body.mobileNumber } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update phone' } }, { status: 500 });
  }
}
