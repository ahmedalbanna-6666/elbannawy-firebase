import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { permission?: string };
    const db = getAdminDb();
    const docRef = db.collection('userPermissions').doc(id);
    const doc = await docRef.get();
    const existing: string[] = doc.exists ? (doc.data()?.permissions ?? []) : [];
    if (body.permission && !existing.includes(body.permission)) {
      existing.push(body.permission);
    }
    await docRef.set({ permissions: existing }, { merge: true });
    return NextResponse.json({ success: true, data: { grantedPermissions: existing } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to grant permission' } }, { status: 500 });
  }
}
