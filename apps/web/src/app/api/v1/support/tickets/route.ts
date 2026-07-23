import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { userCanAnswerSupport } from '@/lib/firebase/permission-checker';
import { SupportTicketRepository, UserService } from '@el-bannawy/lib';

const supportRepo = new SupportTicketRepository();
const userService = new UserService();

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } }, { status: 401 });
    }

    const isSupport = await userCanAnswerSupport(decoded.uid, caller.value.role);

    const { searchParams } = new URL(request.url);
    const filter: Record<string, unknown> = {};

    if (!isSupport) {
      filter.userId = decoded.uid;
    }
    if (searchParams.get('status')) filter.status = searchParams.get('status');
    if (searchParams.get('assignedTo')) filter.assignedTo = searchParams.get('assignedTo');

    const result = await supportRepo.list(filter as any);
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
    const ticket = {
      id: body.id as string || `tkt_${Date.now()}`,
      userId: decoded.uid,
      subject: body.subject as string,
      description: body.description as string,
      category: (body.category as string) || 'general',
      priority: (body.priority as string) || 'NORMAL',
      status: 'OPEN',
      createdAt: now,
      updatedAt: now,
    };

    const result = await supportRepo.create(ticket as any);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
