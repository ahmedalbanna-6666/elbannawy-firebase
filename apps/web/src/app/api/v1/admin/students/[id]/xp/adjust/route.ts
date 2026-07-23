import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { amount?: number; reason?: string };
    const amount = Number(body.amount) || 0;
    const reason = (body.reason as string) ?? 'Administrator adjustment';
    const db = getAdminDb();
    const docRef = db.collection('users').doc(id);
    const now = new Date().toISOString();
    await db.runTransaction(async (tx) => {
      const doc = await tx.get(docRef);
      if (!doc.exists) throw new Error('User not found');
      const data = doc.data() as { xpTotal?: number };
      const currentXp = data.xpTotal ?? 0;
      tx.update(docRef, { xpTotal: Math.max(0, currentXp + amount), updatedAt: now });
    });
    return NextResponse.json({ success: true, data: { id, xpAdjustment: amount } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to adjust XP' } }, { status: 500 });
  }
}
