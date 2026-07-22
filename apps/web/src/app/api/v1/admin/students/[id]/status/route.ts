import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@el-bannawy/lib';

const userRepo = new UserRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { status?: string };
    const requestId = 'status-' + id + '-' + String(Date.now());
    if (body.status !== 'active') {
      await userRepo.softDeleteUser(id, requestId);
    }
    return NextResponse.json({ success: true, data: { id, status: body.status } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update status' } }, { status: 500 });
  }
}
