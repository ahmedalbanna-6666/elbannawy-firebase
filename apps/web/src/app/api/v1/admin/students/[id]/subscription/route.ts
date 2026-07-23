import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const snap = await db.collection('payments')
      .where('userId', '==', id)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get()
      .catch(() => null);
    const payments = snap ? snap.docs.map((d) => ({ id: d.id, ...d.data() })) : [];
    return NextResponse.json({ success: true, data: { payments } });
  } catch {
    return NextResponse.json({ success: true, data: { payments: [] } });
  }
}
