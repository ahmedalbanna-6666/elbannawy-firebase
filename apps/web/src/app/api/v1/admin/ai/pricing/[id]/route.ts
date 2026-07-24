import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    const body = await request.json() as Record<string, unknown>;
    const db = getAdminDb();
    const now = new Date().toISOString();
    const data = {
      ...body,
      updatedAt: now,
    };
    await db.collection('aiTokenPricing').doc(id).set(data, { merge: true });
    return NextResponse.json({ success: true, data: { id, ...data } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update AI pricing plan' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }): Promise<NextResponse> {
  try {
    const { id } = await params;
    const db = getAdminDb();
    await db.collection('aiTokenPricing').doc(id).delete();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to delete AI pricing plan' } }, { status: 500 });
  }
}
