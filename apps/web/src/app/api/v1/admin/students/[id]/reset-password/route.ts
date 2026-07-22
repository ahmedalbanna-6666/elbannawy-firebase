import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    await getAdminAuth().updateUser(id, { password: 'password123' });
    return NextResponse.json({ success: true, data: { message: 'Password reset to default' } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to reset password' } }, { status: 500 });
  }
}
