import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/firebase/auth-helper';
import { ReportRepository, UserService } from '@el-bannawy/lib';

const reportRepo = new ReportRepository();
const userService = new UserService();

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const decoded = await authenticateRequest(request);
    if (!decoded) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } }, { status: 401 });
    }

    const caller = await userService.getUserById(decoded.uid);
    if (!caller.ok) {
      return NextResponse.json({ success: false, error: { code: 'UNAUTHORIZED', message: 'User not found' } }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try { body = await request.json() as Record<string, unknown>; } catch {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'Invalid JSON body' } }, { status: 400 });
    }

    const periodStart = body.periodStart as string;
    const periodEnd = body.periodEnd as string;
    const periodType = (body.periodType as string) || 'CUSTOM';

    if (!periodStart || !periodEnd) {
      return NextResponse.json({ success: false, error: { code: 'INVALID_INPUT', message: 'periodStart and periodEnd are required' } }, { status: 400 });
    }

    let studentId = decoded.uid;
    if (body.studentId && (caller.value.role === 'teacher' || caller.value.role === 'administrator')) {
      studentId = body.studentId as string;
    }

    const result = await reportRepo.generateReport(studentId, periodType, periodStart, periodEnd);
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 });
    }
    return NextResponse.json({ success: true, data: result.value }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ success: false, error: { code: 'INTERNAL', message: error instanceof Error ? error.message : 'Unknown error' } }, { status: 500 });
  }
}
