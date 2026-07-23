import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { getAdminDb } from '@/lib/firebase/admin';
import { LiveRepository } from '@el-bannawy/lib';

const liveRepo = new LiveRepository();

function mapErrorCode(code: string): number {
  switch (code) {
    case 'INVALID_INPUT': return 400;
    case 'NOT_FOUND': return 404;
    case 'ALREADY_EXISTS': return 409;
    case 'FORBIDDEN': return 403;
    default: return 500;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const { id } = await params;
    const result = await liveRepo.getSessionById(id);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    }

    if (!result.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Session not found' } }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = (userDoc.data() as { role?: string })?.role ?? 'student';
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only teachers and admins can update sessions' } }, { status: 403 });
    }

    const { id } = await params;

    let body: Record<string, unknown>;
    try {
      body = await request.json() as Record<string, unknown>;
    } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const result = await liveRepo.updateSession(id, body as any);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    }

    return NextResponse.json({ success: true, data: result.value });
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
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } }, { status: 401 });
    }

    const db = getAdminDb();
    const userDoc = await db.collection('users').doc(decoded.uid).get();
    const role = (userDoc.data() as { role?: string })?.role ?? 'student';
    if (role !== 'teacher' && role !== 'admin') {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Only teachers and admins can delete sessions' } }, { status: 403 });
    }

    const { id } = await params;
    const result = await liveRepo.deleteSession(id);

    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: mapErrorCode(result.error.code) });
    }

    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
