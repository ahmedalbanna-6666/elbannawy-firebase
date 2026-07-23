import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const snap = await db.collection('attendance')
      .where('userId', '==', id)
      .orderBy('date', 'desc')
      .limit(50)
      .get()
      .catch(() => null);
    const records = snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
    return NextResponse.json({ success: true, data: records });
  } catch {
    return NextResponse.json({ success: true, data: [] });
  }
}
