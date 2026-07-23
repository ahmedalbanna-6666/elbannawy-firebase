import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    await db.collection('users').doc(id).update({
      deviceId: null,
      deviceType: null,
      updatedAt: new Date().toISOString(),
    });
    return NextResponse.json({ success: true, data: { id, message: 'Device reset successfully' } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to reset device' } }, { status: 500 });
  }
}
