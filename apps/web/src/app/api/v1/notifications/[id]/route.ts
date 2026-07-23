import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { NotificationRepository } from '@el-bannawy/lib';

const notificationRepo = new NotificationRepository();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const existing = await notificationRepo.getById(id);
    if (!existing.ok || !existing.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } }, { status: 404 });
    }
    if (existing.value.userId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your notification' } }, { status: 403 });
    }

    const result = await notificationRepo.markRead(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const existing = await notificationRepo.getById(id);
    if (!existing.ok || !existing.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Notification not found' } }, { status: 404 });
    }
    if (existing.value.userId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your notification' } }, { status: 403 });
    }

    const result = await notificationRepo.delete(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
