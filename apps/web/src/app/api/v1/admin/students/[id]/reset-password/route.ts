import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebase/admin';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { newPassword?: string };
    const password = (body.newPassword as string) ?? 'password123';
    if (password.length < 6) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Password must be at least 6 characters' } }, { status: 400 });
    }
    await getAdminAuth().updateUser(id, { password });
    return NextResponse.json({ success: true, data: { message: 'Password reset successfully' } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to reset password' } }, { status: 500 });
  }
}
