import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { NotificationRepository } from '@el-bannawy/lib';

const notificationRepo = new NotificationRepository();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = { userId: decoded.uid };
    const readParam = searchParams.get('filter');
    if (readParam === 'unread') filter.read = false;
    else if (readParam === 'read') filter.read = true;

    const result = await notificationRepo.list(filter as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const notification = {
      id: body.id as string || `notif_${Date.now()}`,
      userId: body.userId as string || decoded.uid,
      title: body.title as string,
      message: body.message as string,
      type: (body.type as string) || 'general',
      priority: (body.priority as string) || 'NORMAL',
      link: body.link as string | undefined,
      read: false,
      createdAt: now,
      updatedAt: now,
    };

    const result = await notificationRepo.create(notification as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
