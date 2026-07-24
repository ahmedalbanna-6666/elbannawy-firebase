import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(): Promise<NextResponse> {
  try {
    const db = getAdminDb();
    const snap = await db.collection('aiTokenPricing').orderBy('minTokens', 'asc').get();
    const items = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ success: true, data: items });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to fetch AI pricing' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const docRef = db.collection('aiTokenPricing').doc();
    const data = {
      ...body,
      id: docRef.id,
      active: true,
      createdAt: now,
      updatedAt: now,
    };
    await docRef.set(data);
    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to create AI pricing plan' } }, { status: 500 });
  }
}
