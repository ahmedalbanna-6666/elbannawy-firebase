import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { userCanAnswerSupport } from '@/lib/firebase/permission-checker';
import { SupportTicketRepository, UserService } from '@el-bannawy/lib';

const supportRepo = new SupportTicketRepository();
const userService = new UserService();

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(_request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const result = await supportRepo.getById(id);
    if (!result.ok || !result.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 });
    }

    const caller = await userService.getUserById(decoded.uid);
    const isSupport = caller.ok ? await userCanAnswerSupport(decoded.uid, caller.value.role) : false;
    if (!isSupport && result.value.userId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your ticket' } }, { status: 403 });
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
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const existing = await supportRepo.getById(id);
    if (!existing.ok || !existing.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 });
    }

    const caller = await userService.getUserById(decoded.uid);
    const isSupport = caller.ok ? await userCanAnswerSupport(decoded.uid, caller.value.role) : false;
    if (!isSupport && existing.value.userId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your ticket' } }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    if (!isSupport) {
      delete body.assignedTo;
      delete body.priority;
    }

    const result = await supportRepo.update(id, body as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
