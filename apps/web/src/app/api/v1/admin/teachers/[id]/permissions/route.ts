import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const db = getAdminDb();
    const doc = await db.collection('userPermissions').doc(id).get();
    const grantedPermissions: string[] = doc.exists ? (doc.data()?.permissions ?? []) : [];
    return NextResponse.json({ success: true, data: { grantedPermissions } });
  } catch {
    return NextResponse.json({ success: true, data: { grantedPermissions: [] } });
  }
}
