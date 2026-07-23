import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { SupportTicketRepository, UserService } from '@el-bannawy/lib';

const supportRepo = new SupportTicketRepository();
const userService = new UserService();

export async function POST(
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

    const result = await supportRepo.resolve(id);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: null });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
