import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { DeviceTokenRepository } from '@el-bannawy/lib';

const deviceTokenRepo = new DeviceTokenRepository();

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

    const token = body.token as string;
    const platform = (body.platform as string) || 'web';

    if (!token) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'token is required' } }, { status: 400 });
    }

    const existing = await deviceTokenRepo.list({ userId: decoded.uid, active: true });
    const alreadyRegistered = existing.ok && existing.value.some((t) => t.token === token);

    if (alreadyRegistered) {
      return NextResponse.json({ success: true, data: { message: 'Token already registered' } });
    }

    const now = new Date().toISOString();
    const deviceToken = {
      id: `dt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      userId: decoded.uid,
      token,
      platform,
      lastSeenAt: now,
      active: true,
      createdAt: now,
      updatedAt: now,
    };

    const result = await deviceTokenRepo.create(deviceToken as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (token) {
      await deviceTokenRepo.deactivateByToken(token);
    } else {
      await deviceTokenRepo.deactivateByUser(decoded.uid);
    }

    return NextResponse.json({ success: true, data: { message: 'Tokens deactivated' } });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
