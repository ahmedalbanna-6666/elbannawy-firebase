import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@el-bannawy/lib';

const userRepo = new UserRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { mobileNumber?: string };
    const result = await userRepo.updateProfile(id, { mobileNumber: body.mobileNumber }, 0);
    if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    return NextResponse.json({ success: true, data: result.value });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update phone' } }, { status: 500 });
  }
}
