import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
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

    const ticket = await supportRepo.getById(id);
    if (!ticket.ok || !ticket.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 });
    }

    const caller = await userService.getUserById(decoded.uid);
    const isSupport = caller.ok && (caller.value.role === 'support' || caller.value.role === 'administrator');
    if (!isSupport && ticket.value.userId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your ticket' } }, { status: 403 });
    }

    const result = await supportRepo.listMessages(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    const messages = isSupport ? result.value : result.value.filter((m) => !m.internal);
    return NextResponse.json({ success: true, data: messages });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const { id } = await params;

    const ticket = await supportRepo.getById(id);
    if (!ticket.ok || !ticket.value) {
      return NextResponse.json({ success: false, error: { code: 'NOT_FOUND', message: 'Ticket not found' } }, { status: 404 });
    }

    const caller = await userService.getUserById(decoded.uid);
    const isSupport = caller.ok && (caller.value.role === 'support' || caller.value.role === 'administrator');
    if (!isSupport && ticket.value.userId !== decoded.uid) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Not your ticket' } }, { status: 403 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    if (!body.message) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'message is required' } }, { status: 400 });
    }

    const now = new Date().toISOString();
    const message = {
      id: `msg_${Date.now()}`,
      ticketId: id,
      senderId: decoded.uid,
      message: body.message as string,
      internal: isSupport ? (body.internal === true) : false,
      attachments: body.attachments as string[] | undefined,
      createdAt: now,
    };

    const result = await supportRepo.addMessage(message as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }

    if (ticket.value.status === 'OPEN' || ticket.value.status === 'WAITING') {
      await supportRepo.update(id, { status: 'IN_PROGRESS' } as any);
    }

    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
