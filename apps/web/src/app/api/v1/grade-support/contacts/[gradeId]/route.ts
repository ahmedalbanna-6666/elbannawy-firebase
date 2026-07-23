import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { SupportTicketRepository, UserService } from '@el-bannawy/lib';

const supportRepo = new SupportTicketRepository();
const userService = new UserService();

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gradeId: string }> },
): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok || (caller.value.role !== 'support' && caller.value.role !== 'administrator')) {
      return NextResponse.json({ success: false, error: { code: 'FORBIDDEN', message: 'Support agents only' } }, { status: 403 });
    }

    const { gradeId } = await params;

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const contact = {
      id: gradeId,
      gradeId,
      phone: (body.phone as string) || null,
      email: (body.email as string) || null,
      whatsapp: (body.whatsapp as string) || null,
    };

    const result = await supportRepo.upsertGradeSupportContact(contact as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
