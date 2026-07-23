import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { amount?: number; reason?: string };
    const amount = Math.abs(Number(body.amount) || 0);
    if (amount <= 0) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Amount must be positive' } }, { status: 400 });
    }
    const db = getAdminDb();
    const docRef = db.collection('users').doc(id);
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists) throw new Error('User not found');
      const current = (doc.data() as { coins?: number })?.coins ?? 0;
      tx.update(docRef, { coins: Math.max(0, current - amount), updatedAt: new Date().toISOString() });
    });
    return NextResponse.json({ success: true, data: { id, amountRemoved: amount } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to remove coins' } }, { status: 500 });
  }
}
