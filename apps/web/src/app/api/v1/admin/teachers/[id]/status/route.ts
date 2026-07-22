import { NextRequest, NextResponse } from 'next/server';
import { UserRepository } from '@el-bannawy/lib';

const userRepo = new UserRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const { id } = await params;
  try {
    const body = await request.json() as { status?: string; reason?: string };
    const requestId = 'status-' + id + '-' + String(Date.now());
    const isActive = body.status === 'active';
    if (!isActive) {
      const result = await userRepo.softDeleteUser(id, requestId);
      if (!result.ok) return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, data: { id, status: body.status } });
  } catch {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: 'Failed to update status' } }, { status: 500 });
  }
}
